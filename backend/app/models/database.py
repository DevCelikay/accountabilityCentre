from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum

Base = declarative_base()


class EventSource(enum.Enum):
    """Source of calendar events"""
    GOOGLE_CALENDAR = "google_calendar"
    MANUAL = "manual"
    AI_SCHEDULED = "ai_scheduled"


class EventStatus(enum.Enum):
    """Status of scheduled events"""
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class TaskPriority(enum.Enum):
    """Priority levels matching frontend"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class CalendarEvent(Base):
    """Stores all calendar events from Google + AI-scheduled tasks"""
    __tablename__ = "calendar_events"

    id = Column(String, primary_key=True)
    google_event_id = Column(String, nullable=True, index=True)  # If from Google Calendar

    # Event details
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)

    # Time
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)

    # Metadata
    source = Column(SQLEnum(EventSource), nullable=False, default=EventSource.MANUAL)
    status = Column(SQLEnum(EventStatus), nullable=False, default=EventStatus.SCHEDULED)
    is_flexible = Column(Boolean, default=False)  # Can this be moved by AI?
    is_all_day = Column(Boolean, default=False)

    # Linking to frontend tasks (if this event represents a task)
    frontend_task_id = Column(String, nullable=True, index=True)

    # Priority & Energy
    priority = Column(SQLEnum(TaskPriority), nullable=True)
    energy_required = Column(String, nullable=True)  # "high", "medium", "low", "recharge"

    # AI metadata
    ai_scheduled = Column(Boolean, default=False)
    ai_confidence_score = Column(Float, nullable=True)  # 0-1 confidence in scheduling
    ai_reasoning = Column(Text, nullable=True)  # Why AI placed it here

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Color coding (for UI)
    color = Column(String, nullable=True)


class SchedulingDecision(Base):
    """Tracks AI scheduling decisions for learning/debugging"""
    __tablename__ = "scheduling_decisions"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Input context
    task_id = Column(String, nullable=False)
    task_title = Column(String, nullable=False)
    requested_time = Column(DateTime, nullable=True)  # User's requested time (if any)

    # AI decision
    scheduled_time = Column(DateTime, nullable=False)
    reasoning = Column(Text, nullable=False)  # GPT-4's explanation
    confidence_score = Column(Float, nullable=False)  # 0-1

    # Constraints considered
    constraints_applied = Column(Text, nullable=True)  # JSON string of constraints
    alternatives_considered = Column(Text, nullable=True)  # JSON of other time slots

    # Outcome tracking
    was_accepted = Column(Boolean, default=True)  # Did user accept this scheduling?
    was_rescheduled = Column(Boolean, default=False)
    user_feedback = Column(Text, nullable=True)

    # Model info
    model_used = Column(String, default="gpt-4")
    tokens_used = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class GoogleCalendarSync(Base):
    """Tracks Google Calendar sync state"""
    __tablename__ = "google_calendar_sync"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # OAuth tokens
    user_email = Column(String, nullable=False, unique=True)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    token_expiry = Column(DateTime, nullable=False)

    # Sync metadata
    calendar_id = Column(String, nullable=False)  # Primary calendar ID
    last_sync_time = Column(DateTime, nullable=True)
    sync_token = Column(String, nullable=True)  # For incremental sync

    # Settings
    sync_enabled = Column(Boolean, default=True)
    auto_schedule_enabled = Column(Boolean, default=True)  # Allow AI to create events?

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SchedulingPattern(Base):
    """Learns patterns from user behavior for better AI decisions"""
    __tablename__ = "scheduling_patterns"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Pattern type
    pattern_type = Column(String, nullable=False)  # "task_type_time", "duration_accuracy", etc.

    # Pattern data
    task_category = Column(String, nullable=True)  # "client_work", "school", etc.
    preferred_time_start = Column(Integer, nullable=True)  # Hour of day (0-23)
    preferred_day = Column(Integer, nullable=True)  # Day of week (0-6)

    # Metrics
    success_rate = Column(Float, default=0.0)  # % of times user didn't reschedule
    sample_size = Column(Integer, default=0)  # How many data points

    # Learning data
    avg_duration_diff = Column(Float, nullable=True)  # Actual vs estimated duration

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Database setup function
def get_engine(database_url: str):
    """Create database engine"""
    return create_engine(
        database_url,
        connect_args={"check_same_thread": False} if "sqlite" in database_url else {}
    )


def get_session_local(engine):
    """Create session factory"""
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db(database_url: str):
    """Initialize database tables"""
    engine = get_engine(database_url)
    Base.metadata.create_all(bind=engine)
    return engine
