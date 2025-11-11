"""Google Calendar integration endpoints"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from app.models.schemas import (
    GoogleAuthRequest,
    GoogleAuthResponse,
    SyncCalendarRequest,
    SyncCalendarResponse,
    CalendarEventResponse,
    CalendarEventUpdate,
)
from app.models.database import get_engine, get_session_local, GoogleCalendarSync, CalendarEvent, EventSource, EventStatus
from app.services.google_calendar import google_calendar_service
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


# Dependency to get database session
def get_db():
    engine = get_engine(settings.database_url)
    SessionLocal = get_session_local(engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/auth/url")
async def get_google_auth_url():
    """Get Google OAuth2 authorization URL"""
    try:
        auth_url = google_calendar_service.get_auth_url()
        return {"auth_url": auth_url}
    except Exception as e:
        logger.error(f"Error generating auth URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/auth/callback", response_model=GoogleAuthResponse)
async def google_auth_callback(
    code: str,
    state: str = None,
    db: Session = Depends(get_db)
):
    """
    Handle Google OAuth2 callback.
    Exchange authorization code for tokens and store in database.
    """
    try:
        # Exchange code for tokens
        tokens = google_calendar_service.exchange_code_for_tokens(code)

        # Build service
        google_calendar_service.build_service(
            tokens["access_token"],
            tokens["refresh_token"],
            tokens["token_expiry"]
        )

        # Get user info
        user_email = google_calendar_service.get_user_email()
        calendar_id = google_calendar_service.get_primary_calendar_id()

        # Store in database
        sync_record = db.query(GoogleCalendarSync).filter_by(user_email=user_email).first()

        if sync_record:
            # Update existing
            sync_record.access_token = tokens["access_token"]
            sync_record.refresh_token = tokens["refresh_token"]
            sync_record.token_expiry = tokens["token_expiry"]
            sync_record.calendar_id = calendar_id
            sync_record.updated_at = datetime.utcnow()
        else:
            # Create new
            sync_record = GoogleCalendarSync(
                user_email=user_email,
                access_token=tokens["access_token"],
                refresh_token=tokens["refresh_token"],
                token_expiry=tokens["token_expiry"],
                calendar_id=calendar_id,
                sync_enabled=True,
                auto_schedule_enabled=True,
            )
            db.add(sync_record)

        db.commit()

        logger.info(f"Google Calendar connected for {user_email}")

        return GoogleAuthResponse(
            success=True,
            user_email=user_email,
            calendar_id=calendar_id,
            message="Google Calendar connected successfully"
        )

    except Exception as e:
        logger.error(f"Error in OAuth callback: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync", response_model=SyncCalendarResponse)
async def sync_calendar(
    request: SyncCalendarRequest,
    db: Session = Depends(get_db)
):
    """
    Sync events from Google Calendar to local database.
    Supports incremental sync using sync tokens.
    """
    try:
        # Get sync record
        sync_record = db.query(GoogleCalendarSync).filter_by(sync_enabled=True).first()

        if not sync_record:
            raise HTTPException(status_code=404, detail="Google Calendar not connected")

        # Build service with stored credentials
        google_calendar_service.build_service(
            sync_record.access_token,
            sync_record.refresh_token,
            sync_record.token_expiry
        )

        # Determine sync mode
        sync_token = None if request.full_sync else sync_record.sync_token
        time_min = datetime.utcnow() - timedelta(days=7)  # Past week
        time_max = datetime.utcnow() + timedelta(days=30)  # Next 30 days

        # Fetch events
        result = google_calendar_service.fetch_events(
            calendar_id=sync_record.calendar_id,
            time_min=time_min,
            time_max=time_max,
            sync_token=sync_token
        )

        events = result['events']
        next_sync_token = result['next_sync_token']

        # Update database
        events_added = 0
        events_updated = 0

        for event_data in events:
            existing = db.query(CalendarEvent).filter_by(
                google_event_id=event_data['google_event_id']
            ).first()

            if existing:
                # Update existing event
                existing.title = event_data['title']
                existing.description = event_data['description']
                existing.location = event_data['location']
                existing.start_time = event_data['start_time']
                existing.end_time = event_data['end_time']
                existing.is_all_day = event_data['is_all_day']
                existing.updated_at = datetime.utcnow()
                events_updated += 1
            else:
                # Create new event
                new_event = CalendarEvent(
                    id=f"gcal_{event_data['google_event_id']}",
                    google_event_id=event_data['google_event_id'],
                    title=event_data['title'],
                    description=event_data['description'],
                    location=event_data['location'],
                    start_time=event_data['start_time'],
                    end_time=event_data['end_time'],
                    is_all_day=event_data['is_all_day'],
                    source=EventSource.GOOGLE_CALENDAR,
                    status=EventStatus.SCHEDULED,
                    is_flexible=False,  # Google Calendar events are fixed
                    color=event_data['color'],
                )
                db.add(new_event)
                events_added += 1

        # Update sync record
        sync_record.last_sync_time = datetime.utcnow()
        if next_sync_token:
            sync_record.sync_token = next_sync_token
        sync_record.updated_at = datetime.utcnow()

        db.commit()

        logger.info(f"Synced {len(events)} events: {events_added} added, {events_updated} updated")

        return SyncCalendarResponse(
            events_synced=len(events),
            events_added=events_added,
            events_updated=events_updated,
            events_deleted=0,  # Not tracking deletes yet
            last_sync_time=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Error syncing calendar: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events", response_model=list[CalendarEventResponse])
async def get_calendar_events(
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """
    Get calendar events from local database.

    Args:
        start_date: Start date in ISO format (optional)
        end_date: End date in ISO format (optional)
    """
    try:
        query = db.query(CalendarEvent).filter(CalendarEvent.status == EventStatus.SCHEDULED)

        if start_date:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(CalendarEvent.start_time >= start_dt)

        if end_date:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(CalendarEvent.end_time <= end_dt)

        events = query.order_by(CalendarEvent.start_time).all()

        return events

    except Exception as e:
        logger.error(f"Error fetching events: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_sync_status(db: Session = Depends(get_db)):
    """Get Google Calendar sync status"""
    try:
        sync_record = db.query(GoogleCalendarSync).filter_by(sync_enabled=True).first()

        if not sync_record:
            return {
                "connected": False,
                "message": "Google Calendar not connected"
            }

        return {
            "connected": True,
            "user_email": sync_record.user_email,
            "calendar_id": sync_record.calendar_id,
            "last_sync": sync_record.last_sync_time.isoformat() if sync_record.last_sync_time else None,
            "auto_schedule_enabled": sync_record.auto_schedule_enabled,
        }

    except Exception as e:
        logger.error(f"Error getting sync status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/events/{event_id}", response_model=CalendarEventResponse)
async def update_calendar_event(
    event_id: str,
    update_data: CalendarEventUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a calendar event.
    Supports updating both local and Google Calendar events.
    """
    try:
        # Find the event
        event = db.query(CalendarEvent).filter_by(id=event_id).first()

        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Update fields if provided
        update_dict = update_data.model_dump(exclude_unset=True)

        for field, value in update_dict.items():
            if hasattr(event, field):
                setattr(event, field, value)

        event.updated_at = datetime.utcnow()

        # If this is a Google Calendar event, sync back to Google
        if event.google_event_id and event.source == EventSource.GOOGLE_CALENDAR:
            try:
                # Get sync record to build service
                sync_record = db.query(GoogleCalendarSync).filter_by(sync_enabled=True).first()

                if sync_record:
                    google_calendar_service.build_service(
                        sync_record.access_token,
                        sync_record.refresh_token,
                        sync_record.token_expiry
                    )

                    # Update event in Google Calendar
                    google_calendar_service.update_event(
                        calendar_id=sync_record.calendar_id,
                        event_id=event.google_event_id,
                        title=event.title,
                        description=event.description,
                        location=event.location,
                        start_time=event.start_time,
                        end_time=event.end_time,
                        is_all_day=event.is_all_day
                    )
                    logger.info(f"Updated event in Google Calendar: {event.google_event_id}")
            except Exception as e:
                logger.warning(f"Could not sync update to Google Calendar: {e}")
                # Continue with local update even if Google sync fails

        db.commit()
        db.refresh(event)

        logger.info(f"Updated event: {event.id}")

        return event

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/events/{event_id}")
async def delete_calendar_event(
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a calendar event.
    Supports deleting both local and Google Calendar events.
    """
    try:
        # Find the event
        event = db.query(CalendarEvent).filter_by(id=event_id).first()

        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # If this is a Google Calendar event, delete from Google
        if event.google_event_id and event.source == EventSource.GOOGLE_CALENDAR:
            try:
                sync_record = db.query(GoogleCalendarSync).filter_by(sync_enabled=True).first()

                if sync_record:
                    google_calendar_service.build_service(
                        sync_record.access_token,
                        sync_record.refresh_token,
                        sync_record.token_expiry
                    )

                    google_calendar_service.delete_event(
                        calendar_id=sync_record.calendar_id,
                        event_id=event.google_event_id
                    )
                    logger.info(f"Deleted event from Google Calendar: {event.google_event_id}")
            except Exception as e:
                logger.warning(f"Could not delete from Google Calendar: {e}")

        db.delete(event)
        db.commit()

        logger.info(f"Deleted event: {event_id}")

        return {"success": True, "message": "Event deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting event: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
