"""Core scheduling endpoints"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
import uuid

from app.models.schemas import (
    ScheduleTaskRequest,
    ScheduleTaskResponse,
    BulkScheduleRequest,
    BulkScheduleResponse,
    RebalanceRequest,
    RebalanceResponse,
)
from app.models.database import (
    get_engine,
    get_session_local,
    CalendarEvent,
    SchedulingDecision,
    EventSource,
    EventStatus,
    TaskPriority,
)
from app.services.constraint_solver import ConstraintSolver
from app.services.ai_scheduler import ai_scheduler
from app.services.google_calendar import google_calendar_service
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


def get_db():
    engine = get_engine(settings.database_url)
    SessionLocal = get_session_local(engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/task", response_model=ScheduleTaskResponse)
async def schedule_task(
    request: ScheduleTaskRequest,
    db: Session = Depends(get_db)
):
    """
    Schedule a single task using AI + constraint solver.

    Flow:
    1. Get available time slots (excluding fixed blocks + existing events)
    2. Run constraint solver to find optimal slot
    3. Use GPT-4 to validate/enhance decision
    4. Create calendar event
    5. Optionally push to Google Calendar
    """
    try:
        task = request.task
        logger.info(f"Scheduling task: {task.title}")

        # Determine time window
        if request.time_window == "today":
            start_date = datetime.now().replace(hour=0, minute=0, second=0)
            end_date = start_date + timedelta(days=1)
        elif request.time_window == "week":
            start_date = datetime.now().replace(hour=0, minute=0, second=0)
            end_date = start_date + timedelta(days=7)
        else:  # month
            start_date = datetime.now().replace(hour=0, minute=0, second=0)
            end_date = start_date + timedelta(days=30)

        # Get existing events
        existing_events = db.query(CalendarEvent).filter(
            CalendarEvent.start_time >= start_date,
            CalendarEvent.end_time <= end_date,
            CalendarEvent.status == EventStatus.SCHEDULED
        ).all()

        existing_events_dict = [
            {
                "start_time": evt.start_time,
                "end_time": evt.end_time,
                "title": evt.title,
            }
            for evt in existing_events
        ]

        # Initialize constraint solver
        solver = ConstraintSolver()

        # Get available slots
        available_slots = solver.get_available_slots(
            start_date,
            end_date,
            existing_events_dict
        )

        if not available_slots:
            raise HTTPException(
                status_code=400,
                detail="No available time slots found in the specified time window"
            )

        # Schedule task
        scheduled, unscheduled = solver.schedule_tasks(
            [task],
            available_slots,
            optimize_for="priority"
        )

        if not scheduled:
            raise HTTPException(
                status_code=400,
                detail="Could not find suitable time slot for this task"
            )

        scheduled_task = scheduled[0]

        # Get alternative suggestions
        alternatives = solver.suggest_alternative_slots(task, available_slots, top_n=3)

        # Use AI to enhance decision
        ai_decision = ai_scheduler.enhance_scheduling_decision(
            task,
            scheduled_task.start_time,
            alternatives,
            existing_events_dict
        )

        # Use AI-recommended time if different
        final_start = scheduled_task.start_time
        final_end = scheduled_task.end_time
        reasoning = ai_decision.get("reasoning", "Constraint solver suggestion")
        confidence = ai_decision.get("confidence", 0.85)

        if not ai_decision.get("approve_suggestion", True):
            # AI suggests alternative
            recommended_time_str = ai_decision.get("recommended_time")
            if recommended_time_str:
                try:
                    final_start = datetime.fromisoformat(recommended_time_str)
                    final_end = final_start + timedelta(minutes=task.estimated_time)
                except:
                    pass  # Fallback to constraint solver suggestion

        # Create calendar event
        event_id = str(uuid.uuid4())
        calendar_event = CalendarEvent(
            id=event_id,
            title=task.title,
            description=task.description,
            start_time=final_start,
            end_time=final_end,
            source=EventSource.AI_SCHEDULED,
            status=EventStatus.SCHEDULED,
            is_flexible=True,
            frontend_task_id=task.id,
            priority=TaskPriority(task.priority.value),
            energy_required=task.energy_level.value if task.energy_level else None,
            ai_scheduled=True,
            ai_confidence_score=confidence,
            ai_reasoning=reasoning,
        )

        db.add(calendar_event)

        # Log scheduling decision
        decision = SchedulingDecision(
            task_id=task.id,
            task_title=task.title,
            requested_time=task.preferred_time,
            scheduled_time=final_start,
            reasoning=reasoning,
            confidence_score=confidence,
            was_accepted=True,
        )
        db.add(decision)

        db.commit()

        logger.info(f"Task scheduled: {task.title} at {final_start}")

        return ScheduleTaskResponse(
            task_id=task.id,
            calendar_event_id=event_id,
            scheduled_start=final_start,
            scheduled_end=final_end,
            reasoning=reasoning,
            confidence_score=confidence,
            alternative_slots=alternatives,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scheduling task: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk", response_model=BulkScheduleResponse)
async def bulk_schedule_tasks(
    request: BulkScheduleRequest,
    db: Session = Depends(get_db)
):
    """
    Schedule multiple tasks at once using intelligent optimization.
    """
    try:
        logger.info(f"Bulk scheduling {len(request.tasks)} tasks")

        # Determine time window
        if request.time_window == "today":
            start_date = datetime.now().replace(hour=0, minute=0, second=0)
            end_date = start_date + timedelta(days=1)
        elif request.time_window == "week":
            start_date = datetime.now().replace(hour=0, minute=0, second=0)
            end_date = start_date + timedelta(days=7)
        else:
            start_date = datetime.now().replace(hour=0, minute=0, second=0)
            end_date = start_date + timedelta(days=30)

        # Get existing events
        existing_events = db.query(CalendarEvent).filter(
            CalendarEvent.start_time >= start_date,
            CalendarEvent.end_time <= end_date,
            CalendarEvent.status == EventStatus.SCHEDULED
        ).all()

        existing_events_dict = [
            {"start_time": evt.start_time, "end_time": evt.end_time, "title": evt.title}
            for evt in existing_events
        ]

        # Initialize solver
        solver = ConstraintSolver()
        available_slots = solver.get_available_slots(start_date, end_date, existing_events_dict)

        # Schedule all tasks
        scheduled, unscheduled = solver.schedule_tasks(
            request.tasks,
            available_slots,
            optimize_for=request.optimize_for
        )

        # Create calendar events for scheduled tasks
        scheduled_responses = []
        for scheduled_task in scheduled:
            event_id = str(uuid.uuid4())
            calendar_event = CalendarEvent(
                id=event_id,
                title=scheduled_task.task.title,
                description=scheduled_task.task.description,
                start_time=scheduled_task.start_time,
                end_time=scheduled_task.end_time,
                source=EventSource.AI_SCHEDULED,
                status=EventStatus.SCHEDULED,
                is_flexible=True,
                frontend_task_id=scheduled_task.task.id,
                priority=TaskPriority(scheduled_task.task.priority.value),
                energy_required=scheduled_task.task.energy_level.value if scheduled_task.task.energy_level else None,
                ai_scheduled=True,
                ai_confidence_score=0.85,
                ai_reasoning=f"Scheduled in {scheduled_task.slot.energy.value} energy slot",
            )
            db.add(calendar_event)

            scheduled_responses.append(
                ScheduleTaskResponse(
                    task_id=scheduled_task.task.id,
                    calendar_event_id=event_id,
                    scheduled_start=scheduled_task.start_time,
                    scheduled_end=scheduled_task.end_time,
                    reasoning=f"Scheduled in {scheduled_task.slot.energy.value} energy slot",
                    confidence_score=0.85,
                    alternative_slots=[],
                )
            )

        db.commit()

        unscheduled_dict = [
            {"task_id": task.id, "title": task.title, "reason": "No available slots"}
            for task in unscheduled
        ]

        optimization_summary = (
            f"Successfully scheduled {len(scheduled)} of {len(request.tasks)} tasks. "
            f"{len(unscheduled)} tasks could not fit in available time slots."
        )

        logger.info(optimization_summary)

        return BulkScheduleResponse(
            scheduled_tasks=scheduled_responses,
            unscheduled_tasks=unscheduled_dict,
            optimization_summary=optimization_summary,
        )

    except Exception as e:
        logger.error(f"Error in bulk scheduling: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rebalance", response_model=RebalanceResponse)
async def rebalance_schedule(
    request: RebalanceRequest,
    db: Session = Depends(get_db)
):
    """
    Rebalance schedule after disruption using AI.
    """
    try:
        logger.info(f"Rebalancing schedule: {request.reason}")

        # Get affected date range
        if request.scope == "day":
            start_date = request.affected_date.replace(hour=0, minute=0, second=0)
            end_date = start_date + timedelta(days=1)
        else:  # week
            start_date = request.affected_date.replace(hour=0, minute=0, second=0)
            end_date = start_date + timedelta(days=7)

        # Get flexible events (can be moved)
        flexible_events = db.query(CalendarEvent).filter(
            CalendarEvent.start_time >= start_date,
            CalendarEvent.end_time <= end_date,
            CalendarEvent.status == EventStatus.SCHEDULED,
            CalendarEvent.is_flexible == True,
            ~CalendarEvent.id.in_(request.preserve_events)
        ).all()

        affected_tasks = [
            {
                "id": evt.id,
                "title": evt.title,
                "priority": evt.priority.value if evt.priority else "medium",
                "duration": int((evt.end_time - evt.start_time).total_seconds() / 60),
                "scheduled_time": evt.start_time.isoformat(),
            }
            for evt in flexible_events
        ]

        # Get available slots (recalculate)
        solver = ConstraintSolver()
        existing_fixed = db.query(CalendarEvent).filter(
            CalendarEvent.start_time >= start_date,
            CalendarEvent.end_time <= end_date,
            CalendarEvent.status == EventStatus.SCHEDULED,
            CalendarEvent.is_flexible == False
        ).all()

        existing_events_dict = [
            {"start_time": evt.start_time, "end_time": evt.end_time, "title": evt.title}
            for evt in existing_fixed
        ]

        available_slots = solver.get_available_slots(start_date, end_date, existing_events_dict)
        available_slots_dict = [
            {
                "start_time": slot.start,
                "duration_minutes": slot.duration_minutes,
                "energy": slot.energy.value,
            }
            for slot in available_slots
        ]

        # Use AI to create rebalancing plan
        rebalance_response = ai_scheduler.rebalance_schedule(
            request,
            affected_tasks,
            available_slots_dict
        )

        # Apply changes based on AI recommendations
        for change in rebalance_response.changes:
            event = db.query(CalendarEvent).filter_by(id=change.get("task_id")).first()
            if event:
                action = change.get("action")
                if action == "move" and change.get("new_time"):
                    new_start = datetime.fromisoformat(change["new_time"])
                    duration = (event.end_time - event.start_time).total_seconds() / 60
                    event.start_time = new_start
                    event.end_time = new_start + timedelta(minutes=duration)
                    event.status = EventStatus.RESCHEDULED
                elif action == "defer":
                    event.status = EventStatus.CANCELLED  # Mark for rescheduling

        db.commit()

        logger.info(f"Rebalancing complete: {rebalance_response.reasoning}")

        return rebalance_response

    except Exception as e:
        logger.error(f"Error rebalancing: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
