"""
Google Calendar Integration
Handles OAuth2 authentication, event syncing, and calendar operations.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import pickle
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.core.config import settings

logger = logging.getLogger(__name__)


class GoogleCalendarService:
    """
    Google Calendar API integration.
    Handles OAuth2, event CRUD, and bidirectional sync.
    """

    SCOPES = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
    ]

    def __init__(self):
        self.service = None
        self.credentials = None

    def get_auth_url(self, state: str = None) -> str:
        """
        Generate Google OAuth2 authorization URL.

        Args:
            state: Optional state parameter for CSRF protection

        Returns:
            Authorization URL for user to visit
        """
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.google_redirect_uri],
                }
            },
            scopes=self.SCOPES,
            redirect_uri=settings.google_redirect_uri,
        )

        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state,
            prompt='consent'  # Force consent to get refresh token
        )

        return auth_url

    def exchange_code_for_tokens(self, code: str) -> Dict:
        """
        Exchange authorization code for access tokens.

        Args:
            code: Authorization code from OAuth callback

        Returns:
            Dict with access_token, refresh_token, expiry
        """
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.google_redirect_uri],
                }
            },
            scopes=self.SCOPES,
            redirect_uri=settings.google_redirect_uri,
        )

        flow.fetch_token(code=code)
        credentials = flow.credentials

        return {
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_expiry": credentials.expiry,
        }

    def build_service(self, access_token: str, refresh_token: str, token_expiry: datetime):
        """
        Build Google Calendar API service with credentials.

        Args:
            access_token: OAuth2 access token
            refresh_token: OAuth2 refresh token
            token_expiry: Token expiration datetime
        """
        credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            scopes=self.SCOPES,
        )

        # Refresh if expired
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())

        self.credentials = credentials
        self.service = build('calendar', 'v3', credentials=credentials)
        logger.info("Google Calendar service built successfully")

    def get_primary_calendar_id(self) -> str:
        """Get user's primary calendar ID."""
        try:
            calendar = self.service.calendarList().get(calendarId='primary').execute()
            return calendar['id']
        except HttpError as e:
            logger.error(f"Error getting primary calendar: {e}")
            return 'primary'

    def get_user_email(self) -> str:
        """Get authenticated user's email."""
        try:
            calendar = self.service.calendarList().get(calendarId='primary').execute()
            return calendar.get('summary', 'unknown@email.com')
        except HttpError as e:
            logger.error(f"Error getting user email: {e}")
            return 'unknown@email.com'

    def fetch_events(
        self,
        calendar_id: str = 'primary',
        time_min: Optional[datetime] = None,
        time_max: Optional[datetime] = None,
        sync_token: Optional[str] = None,
    ) -> Dict:
        """
        Fetch events from Google Calendar.

        Args:
            calendar_id: Calendar ID to fetch from
            time_min: Start time for event query
            time_max: End time for event query
            sync_token: Token for incremental sync

        Returns:
            Dict with events and next sync token
        """
        if not self.service:
            raise ValueError("Service not initialized. Call build_service first.")

        try:
            # Default to next 30 days if no time range specified
            if not time_min:
                time_min = datetime.utcnow()
            if not time_max:
                time_max = time_min + timedelta(days=30)

            request_params = {
                'calendarId': calendar_id,
                'singleEvents': True,
                'orderBy': 'startTime',
            }

            # Use sync token for incremental sync, or time range for full sync
            if sync_token:
                request_params['syncToken'] = sync_token
            else:
                request_params['timeMin'] = time_min.isoformat() + 'Z'
                request_params['timeMax'] = time_max.isoformat() + 'Z'

            events_result = self.service.events().list(**request_params).execute()
            events = events_result.get('items', [])
            next_sync_token = events_result.get('nextSyncToken')

            logger.info(f"Fetched {len(events)} events from Google Calendar")

            return {
                'events': self._parse_events(events),
                'next_sync_token': next_sync_token,
            }

        except HttpError as e:
            logger.error(f"Error fetching events: {e}")
            return {'events': [], 'next_sync_token': None}

    def _parse_events(self, raw_events: List[Dict]) -> List[Dict]:
        """Parse raw Google Calendar events into our format."""
        parsed = []

        for event in raw_events:
            # Skip cancelled events
            if event.get('status') == 'cancelled':
                continue

            # Parse start/end times
            start = event.get('start', {})
            end = event.get('end', {})

            # Handle all-day events
            is_all_day = 'date' in start

            if is_all_day:
                start_time = datetime.fromisoformat(start['date'])
                end_time = datetime.fromisoformat(end['date'])
            else:
                start_time = datetime.fromisoformat(start['dateTime'].replace('Z', '+00:00'))
                end_time = datetime.fromisoformat(end['dateTime'].replace('Z', '+00:00'))

            parsed.append({
                'google_event_id': event['id'],
                'title': event.get('summary', 'Untitled Event'),
                'description': event.get('description', ''),
                'location': event.get('location', ''),
                'start_time': start_time,
                'end_time': end_time,
                'is_all_day': is_all_day,
                'color': event.get('colorId', ''),
                'is_flexible': False,  # Google events are typically fixed
            })

        return parsed

    def create_event(
        self,
        title: str,
        start_time: datetime,
        end_time: datetime,
        description: str = '',
        location: str = '',
        calendar_id: str = 'primary',
    ) -> Optional[str]:
        """
        Create a new event in Google Calendar.

        Args:
            title: Event title
            start_time: Start datetime
            end_time: End datetime
            description: Event description
            location: Event location
            calendar_id: Target calendar ID

        Returns:
            Created event ID or None on failure
        """
        if not self.service:
            raise ValueError("Service not initialized")

        event = {
            'summary': title,
            'description': description,
            'location': location,
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'UTC',
            },
        }

        try:
            created_event = self.service.events().insert(
                calendarId=calendar_id,
                body=event
            ).execute()

            logger.info(f"Created event: {title} at {start_time}")
            return created_event['id']

        except HttpError as e:
            logger.error(f"Error creating event: {e}")
            return None

    def update_event(
        self,
        event_id: str,
        title: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        description: Optional[str] = None,
        location: Optional[str] = None,
        is_all_day: Optional[bool] = None,
        calendar_id: str = 'primary',
    ) -> bool:
        """
        Update an existing event in Google Calendar.

        Returns:
            True if successful, False otherwise
        """
        if not self.service:
            raise ValueError("Service not initialized")

        try:
            # Fetch existing event
            event = self.service.events().get(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()

            # Update fields
            if title:
                event['summary'] = title
            if description is not None:
                event['description'] = description
            if location is not None:
                event['location'] = location
            if start_time:
                if is_all_day:
                    event['start'] = {
                        'date': start_time.date().isoformat(),
                    }
                else:
                    event['start'] = {
                        'dateTime': start_time.isoformat(),
                        'timeZone': 'UTC',
                    }
            if end_time:
                if is_all_day:
                    event['end'] = {
                        'date': end_time.date().isoformat(),
                    }
                else:
                    event['end'] = {
                        'dateTime': end_time.isoformat(),
                        'timeZone': 'UTC',
                    }

            # Update event
            self.service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=event
            ).execute()

            logger.info(f"Updated event: {event_id}")
            return True

        except HttpError as e:
            logger.error(f"Error updating event: {e}")
            return False

    def delete_event(self, event_id: str, calendar_id: str = 'primary') -> bool:
        """
        Delete an event from Google Calendar.

        Returns:
            True if successful, False otherwise
        """
        if not self.service:
            raise ValueError("Service not initialized")

        try:
            self.service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()

            logger.info(f"Deleted event: {event_id}")
            return True

        except HttpError as e:
            logger.error(f"Error deleting event: {e}")
            return False


# Singleton instance
google_calendar_service = GoogleCalendarService()
