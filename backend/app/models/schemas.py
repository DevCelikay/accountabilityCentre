"""Pydantic schemas for API requests/responses"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum


class EventSourceEnum(str, Enum):
    GOOGLE_CALENDAR = "google_calendar"
    MANUAL = "manual"
    AI_SCHEDULED = "ai_scheduled"


class EventStatusEnum(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class TaskPriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class EnergyLevelEnum(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    RECHARGE = "recharge"


# ============================================================================
# Calendar Event Schemas
# ============================================================================

class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime
    is_flexible: bool = False
    is_all_day: bool = False
    priority: Optional[TaskPriorityEnum] = None
    energy_required: Optional[EnergyLevelEnum] = None
    color: Optional[str] = None


class CalendarEventCreate(CalendarEventBase):
    frontend_task_id: Optional[str] = None


class CalendarEventUpdate(BaseModel):
    """Update calendar event (partial update)"""
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_flexible: Optional[bool] = None
    is_all_day: Optional[bool] = None
    priority: Optional[TaskPriorityEnum] = None
    energy_required: Optional[EnergyLevelEnum] = None
    color: Optional[str] = None
    status: Optional[EventStatusEnum] = None


class CalendarEventResponse(CalendarEventBase):
    id: str
    google_event_id: Optional[str] = None
    source: EventSourceEnum
    status: EventStatusEnum
    frontend_task_id: Optional[str] = None
    ai_scheduled: bool
    ai_confidence_score: Optional[float] = None
    ai_reasoning: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Task Scheduling Schemas (from frontend)
# ============================================================================

class TaskToSchedule(BaseModel):
    """Task from frontend that needs to be scheduled"""
    id: str
    title: str
    description: Optional[str] = None
    priority: TaskPriorityEnum
    estimated_time: int  # minutes
    due_date: Optional[datetime] = None
    tags: List[str] = []
    client_name: Optional[str] = None

    # Scheduling preferences
    preferred_time: Optional[datetime] = None  # User's preference
    must_be_before: Optional[datetime] = None  # Hard deadline
    energy_level: Optional[EnergyLevelEnum] = None  # Inferred from tags/title


class ScheduleTaskRequest(BaseModel):
    """Request to schedule a task"""
    task: TaskToSchedule
    scheduling_mode: str = "auto"  # "auto", "suggest", "force"
    time_window: Optional[str] = "week"  # "today", "week", "month"


class ScheduleTaskResponse(BaseModel):
    """Response with scheduled time and reasoning"""
    task_id: str
    calendar_event_id: str
    scheduled_start: datetime
    scheduled_end: datetime
    reasoning: str
    confidence_score: float
    alternative_slots: List[Dict[str, Any]] = []


# ============================================================================
# Bulk Scheduling Schemas
# ============================================================================

class BulkScheduleRequest(BaseModel):
    """Schedule multiple tasks at once"""
    tasks: List[TaskToSchedule]
    optimize_for: str = "priority"  # "priority", "deadline", "balance"
    time_window: str = "week"  # "today", "week", "month"


class BulkScheduleResponse(BaseModel):
    """Response with all scheduled tasks"""
    scheduled_tasks: List[ScheduleTaskResponse]
    unscheduled_tasks: List[Dict[str, Any]] = []  # Tasks that couldn't fit
    optimization_summary: str


# ============================================================================
# Rebalancing Schemas
# ============================================================================

class RebalanceRequest(BaseModel):
    """Request to rebalance schedule"""
    reason: str  # "meeting_added", "task_overrun", "manual"
    affected_date: datetime
    scope: str = "day"  # "day", "week"
    preserve_events: List[str] = []  # Event IDs that must not move


class RebalanceResponse(BaseModel):
    """Response with rebalancing plan"""
    changes: List[Dict[str, Any]]
    moved_tasks: List[str]
    deferred_tasks: List[str]
    reasoning: str
    success: bool


# ============================================================================
# Natural Language Scheduling
# ============================================================================

class NaturalLanguageScheduleRequest(BaseModel):
    """Natural language task input"""
    text: str  # e.g., "schedule 30min deep work tomorrow morning"
    context: Optional[Dict[str, Any]] = None  # Additional context


class NaturalLanguageScheduleResponse(BaseModel):
    """Parsed task with scheduling suggestion"""
    parsed_task: TaskToSchedule
    suggested_time: datetime
    confidence: float
    interpretation: str  # What the AI understood


# ============================================================================
# Google Calendar Sync
# ============================================================================

class GoogleAuthRequest(BaseModel):
    """Google OAuth callback"""
    code: str
    redirect_uri: str


class GoogleAuthResponse(BaseModel):
    """OAuth success response"""
    success: bool
    user_email: str
    calendar_id: str
    message: str


class SyncCalendarRequest(BaseModel):
    """Trigger calendar sync"""
    full_sync: bool = False  # False = incremental, True = full resync


class SyncCalendarResponse(BaseModel):
    """Sync results"""
    events_synced: int
    events_added: int
    events_updated: int
    events_deleted: int
    last_sync_time: datetime


# ============================================================================
# AI Insights & Analytics
# ============================================================================

class SchedulingInsightsResponse(BaseModel):
    """AI-powered insights about scheduling patterns"""
    most_productive_times: List[Dict[str, Any]]
    task_duration_accuracy: float  # % accuracy of estimates
    common_scheduling_conflicts: List[str]
    recommendations: List[str]
    energy_pattern_analysis: Dict[str, Any]


class WeeklySchedulePreview(BaseModel):
    """Preview of upcoming week"""
    week_start: datetime
    total_scheduled_hours: float
    breakdown_by_priority: Dict[str, float]
    breakdown_by_category: Dict[str, float]
    available_slots: List[Dict[str, Any]]
    recommended_tasks_to_schedule: List[str]


# ============================================================================
# Health Check
# ============================================================================

class HealthCheckResponse(BaseModel):
    """API health check"""
    status: str
    version: str
    google_calendar_connected: bool
    openai_available: bool
    database_healthy: bool
