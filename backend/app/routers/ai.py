"""AI-powered features endpoints"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from app.models.schemas import (
    NaturalLanguageScheduleRequest,
    NaturalLanguageScheduleResponse,
    SchedulingInsightsResponse,
    WeeklySchedulePreview,
)
from app.models.database import get_engine, get_session_local, CalendarEvent, SchedulingDecision
from app.services.ai_scheduler import ai_scheduler
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


@router.post("/parse", response_model=NaturalLanguageScheduleResponse)
async def parse_natural_language(
    request: NaturalLanguageScheduleRequest,
    db: Session = Depends(get_db)
):
    """
    Parse natural language input into structured task with scheduling suggestion.

    Examples:
    - "schedule 30min deep work tomorrow morning"
    - "add 1 hour client call friday at 2pm"
    - "block 45min for gym tonight"
    """
    try:
        logger.info(f"Parsing: {request.text}")

        # Use AI to parse
        parsed_task, suggested_time, confidence = ai_scheduler.parse_natural_language_task(
            request.text,
            request.context
        )

        interpretation = f"I understood this as: {parsed_task.title} ({parsed_task.estimated_time} minutes) scheduled for {suggested_time.strftime('%A, %B %d at %I:%M %p')}"

        return NaturalLanguageScheduleResponse(
            parsed_task=parsed_task,
            suggested_time=suggested_time,
            confidence=confidence,
            interpretation=interpretation,
        )

    except Exception as e:
        logger.error(f"Error parsing natural language: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights", response_model=SchedulingInsightsResponse)
async def get_scheduling_insights(db: Session = Depends(get_db)):
    """
    Get AI-powered insights about scheduling patterns and productivity.
    """
    try:
        # Get historical data
        past_date = datetime.utcnow() - timedelta(days=30)

        schedule_history = db.query(CalendarEvent).filter(
            CalendarEvent.created_at >= past_date
        ).all()

        completion_data = db.query(SchedulingDecision).filter(
            SchedulingDecision.created_at >= past_date
        ).all()

        schedule_history_dict = [
            {
                "title": evt.title,
                "start_time": evt.start_time.isoformat(),
                "duration": int((evt.end_time - evt.start_time).total_seconds() / 60),
                "priority": evt.priority.value if evt.priority else "medium",
                "energy": evt.energy_required,
                "status": evt.status.value,
            }
            for evt in schedule_history
        ]

        completion_data_dict = [
            {
                "task_title": dec.task_title,
                "scheduled_time": dec.scheduled_time.isoformat(),
                "was_accepted": dec.was_accepted,
                "was_rescheduled": dec.was_rescheduled,
                "confidence_score": dec.confidence_score,
            }
            for dec in completion_data
        ]

        # Generate insights using AI
        insights = ai_scheduler.generate_scheduling_insights(
            schedule_history_dict,
            completion_data_dict
        )

        return SchedulingInsightsResponse(
            most_productive_times=insights.get("most_productive_times", []),
            task_duration_accuracy=insights.get("duration_accuracy", 0.0),
            common_scheduling_conflicts=insights.get("common_conflicts", []),
            recommendations=insights.get("recommendations", []),
            energy_pattern_analysis=insights.get("energy_insights", {}),
        )

    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weekly-preview", response_model=WeeklySchedulePreview)
async def get_weekly_preview(db: Session = Depends(get_db)):
    """
    Get preview of upcoming week with scheduling recommendations.
    """
    try:
        # Calculate week range
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today - timedelta(days=today.weekday())  # Monday
        week_end = week_start + timedelta(days=7)

        # Get scheduled events for this week
        scheduled_events = db.query(CalendarEvent).filter(
            CalendarEvent.start_time >= week_start,
            CalendarEvent.start_time < week_end,
            CalendarEvent.status.in_(["scheduled", "rescheduled"])
        ).all()

        # Calculate metrics
        total_hours = sum([
            (evt.end_time - evt.start_time).total_seconds() / 3600
            for evt in scheduled_events
        ])

        # Breakdown by priority
        priority_breakdown = {}
        for evt in scheduled_events:
            priority = evt.priority.value if evt.priority else "medium"
            duration_hours = (evt.end_time - evt.start_time).total_seconds() / 3600
            priority_breakdown[priority] = priority_breakdown.get(priority, 0) + duration_hours

        # Breakdown by category (infer from tags/title)
        category_breakdown = {
            "client_work": 0.0,
            "founder_work": 0.0,
            "school": 0.0,
            "fitness": 0.0,
            "other": 0.0,
        }

        for evt in scheduled_events:
            duration_hours = (evt.end_time - evt.start_time).total_seconds() / 3600
            title_lower = evt.title.lower()

            if any(word in title_lower for word in ["client", "agency", "delivery"]):
                category_breakdown["client_work"] += duration_hours
            elif any(word in title_lower for word in ["school", "class", "lecture"]):
                category_breakdown["school"] += duration_hours
            elif any(word in title_lower for word in ["gym", "muay thai", "fitness"]):
                category_breakdown["fitness"] += duration_hours
            elif any(word in title_lower for word in ["founder", "gtm", "strategy"]):
                category_breakdown["founder_work"] += duration_hours
            else:
                category_breakdown["other"] += duration_hours

        # Calculate available slots (simplified)
        available_slots = [
            {
                "day": "Monday",
                "time": "06:00-08:00",
                "duration_minutes": 120,
                "energy": "high"
            },
            {
                "day": "Tuesday",
                "time": "15:30-17:30",
                "duration_minutes": 120,
                "energy": "medium"
            },
            # More slots would be calculated dynamically
        ]

        return WeeklySchedulePreview(
            week_start=week_start,
            total_scheduled_hours=total_hours,
            breakdown_by_priority=priority_breakdown,
            breakdown_by_category=category_breakdown,
            available_slots=available_slots,
            recommended_tasks_to_schedule=[
                "High-priority client work needs scheduling",
                "Consider blocking deep work time on Saturday morning",
            ],
        )

    except Exception as e:
        logger.error(f"Error generating weekly preview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/categorize")
async def categorize_task(title: str, description: str = ""):
    """
    Use AI to categorize a task into predefined categories.
    """
    try:
        from app.models.schemas import TaskToSchedule, TaskPriorityEnum

        task = TaskToSchedule(
            id="temp",
            title=title,
            description=description,
            priority=TaskPriorityEnum.MEDIUM,
            estimated_time=30,
            tags=[],
        )

        category = ai_scheduler.infer_task_category(task)

        return {
            "category": category,
            "title": title,
        }

    except Exception as e:
        logger.error(f"Error categorizing task: {e}")
        raise HTTPException(status_code=500, detail=str(e))
