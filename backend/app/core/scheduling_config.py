"""
Scheduling Configuration - Your Personal Rules
This is the brain of your AI scheduler, tuned specifically to YOUR life.
"""

from datetime import time
from typing import Dict, List, Tuple
from enum import Enum


class Priority(Enum):
    """Priority levels matching your hierarchy"""
    CLIENT_DELIVERY = 1  # Highest priority
    OUTBOUND = 2
    FOUNDER_WORK = 3
    FITNESS = 4
    SCHOOL_WORK = 5
    FAMILY = 6
    SOCIAL = 7  # Lowest priority


class EnergyLevel(Enum):
    """Energy requirement for tasks"""
    HIGH = "high"  # Client work, Founder work
    MEDIUM = "medium"  # Outreach, Social posts
    LOW = "low"  # School work, Planning, Errands
    RECHARGE = "recharge"  # Walks, Baths


class TimeBlock:
    """Represents a time block with energy level"""

    def __init__(self, start: time, end: time, energy: EnergyLevel, description: str):
        self.start = start
        self.end = end
        self.energy = energy
        self.description = description

    def duration_minutes(self) -> int:
        """Calculate duration in minutes"""
        start_minutes = self.start.hour * 60 + self.start.minute
        end_minutes = self.end.hour * 60 + self.end.minute
        return end_minutes - start_minutes


# ============================================================================
# YOUR WEEKLY IMMOVABLE BLOCKS
# ============================================================================

FIXED_BLOCKS: Dict[int, List[Tuple[time, time, str]]] = {
    # 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
    0: [  # Monday
        (time(8, 0), time(16, 0), "School + Travel"),
    ],
    1: [  # Tuesday
        (time(8, 0), time(15, 30), "School"),
    ],
    2: [  # Wednesday
        (time(10, 0), time(16, 0), "School"),
        (time(17, 0), time(19, 0), "Muay Thai"),
    ],
    3: [  # Thursday
        (time(8, 0), time(15, 30), "School"),
    ],
    4: [  # Friday
        (time(8, 0), time(14, 30), "School"),
        (time(15, 30), time(17, 30), "Muay Thai"),
    ],
    5: [  # Saturday
        (time(14, 0), time(18, 30), "Saturday Job"),
    ],
    6: [  # Sunday
        # No fixed blocks on Sunday
    ],
}


# ============================================================================
# YOUR ENERGY ZONES (applied to flexible time)
# ============================================================================

def get_energy_zones(weekday: int) -> List[TimeBlock]:
    """
    Returns energy zones for a given weekday, accounting for fixed blocks.
    These define what TYPE of work fits in which time slots.
    """
    zones = []

    # Morning zones (before school/work)
    if weekday == 2:  # Wednesday - starts at 10am
        zones.append(TimeBlock(time(6, 0), time(9, 30), EnergyLevel.HIGH, "Early morning deep work"))
    elif weekday in [0, 1, 3, 4]:  # School days starting at 8am
        zones.append(TimeBlock(time(6, 0), time(7, 30), EnergyLevel.HIGH, "Early morning focus"))
    elif weekday == 5:  # Saturday - free morning
        zones.append(TimeBlock(time(8, 0), time(13, 30), EnergyLevel.HIGH, "Saturday morning focus"))
    elif weekday == 6:  # Sunday - free morning
        zones.append(TimeBlock(time(8, 0), time(13, 0), EnergyLevel.HIGH, "Sunday morning deep work"))

    # Afternoon/Evening zones (after school/work)
    if weekday == 0:  # Monday - after 4pm
        zones.extend([
            TimeBlock(time(16, 0), time(18, 0), EnergyLevel.MEDIUM, "Post-school medium energy"),
            TimeBlock(time(18, 0), time(19, 0), EnergyLevel.LOW, "Evening wind down"),
            TimeBlock(time(19, 0), time(20, 0), EnergyLevel.RECHARGE, "Evening recharge"),
        ])
    elif weekday == 1:  # Tuesday - after 3:30pm
        zones.extend([
            TimeBlock(time(15, 30), time(17, 30), EnergyLevel.MEDIUM, "Afternoon medium work"),
            TimeBlock(time(17, 30), time(19, 0), EnergyLevel.LOW, "Evening low energy"),
            TimeBlock(time(19, 0), time(20, 0), EnergyLevel.RECHARGE, "Evening recharge"),
        ])
    elif weekday == 2:  # Wednesday - after 7pm (post Muay Thai)
        zones.extend([
            TimeBlock(time(19, 0), time(20, 0), EnergyLevel.LOW, "Post-training wind down"),
            TimeBlock(time(20, 0), time(21, 0), EnergyLevel.RECHARGE, "Evening recharge"),
        ])
    elif weekday == 3:  # Thursday - after 3:30pm
        zones.extend([
            TimeBlock(time(15, 30), time(17, 30), EnergyLevel.MEDIUM, "Afternoon work"),
            TimeBlock(time(17, 30), time(19, 0), EnergyLevel.LOW, "Evening tasks"),
            TimeBlock(time(19, 0), time(20, 0), EnergyLevel.RECHARGE, "Evening recharge"),
        ])
    elif weekday == 4:  # Friday - after 5:30pm (post Muay Thai)
        zones.extend([
            TimeBlock(time(17, 30), time(19, 0), EnergyLevel.LOW, "Friday evening wind down"),
            TimeBlock(time(19, 0), time(21, 0), EnergyLevel.RECHARGE, "Friday recharge"),
        ])
    elif weekday == 5:  # Saturday - after 6:30pm
        zones.extend([
            TimeBlock(time(18, 30), time(20, 0), EnergyLevel.LOW, "Saturday evening"),
            TimeBlock(time(20, 0), time(21, 0), EnergyLevel.RECHARGE, "Evening recharge"),
        ])
    elif weekday == 6:  # Sunday - free afternoon/evening
        zones.extend([
            TimeBlock(time(13, 0), time(16, 0), EnergyLevel.MEDIUM, "Sunday afternoon"),
            TimeBlock(time(16, 0), time(18, 0), EnergyLevel.LOW, "Sunday evening prep"),
            TimeBlock(time(18, 0), time(20, 0), EnergyLevel.RECHARGE, "Sunday recharge"),
        ])

    return zones


# ============================================================================
# TASK TYPE → ENERGY MAPPING
# ============================================================================

TASK_ENERGY_MAP: Dict[str, EnergyLevel] = {
    # High energy work
    "client_delivery": EnergyLevel.HIGH,
    "founder_work": EnergyLevel.HIGH,
    "deep_work": EnergyLevel.HIGH,
    "strategy": EnergyLevel.HIGH,
    "gtm": EnergyLevel.HIGH,

    # Medium energy work
    "outbound": EnergyLevel.MEDIUM,
    "prospecting": EnergyLevel.MEDIUM,
    "social_media": EnergyLevel.MEDIUM,
    "content_creation": EnergyLevel.MEDIUM,
    "meetings": EnergyLevel.MEDIUM,
    "calls": EnergyLevel.MEDIUM,

    # Low energy work
    "school_work": EnergyLevel.LOW,
    "revision": EnergyLevel.LOW,
    "homework": EnergyLevel.LOW,
    "planning": EnergyLevel.LOW,
    "errands": EnergyLevel.LOW,
    "admin": EnergyLevel.LOW,
    "email": EnergyLevel.LOW,

    # Fitness (can be high or medium depending on type)
    "gym": EnergyLevel.MEDIUM,
    "fitness": EnergyLevel.MEDIUM,
    "sports": EnergyLevel.MEDIUM,

    # Recharge activities
    "walk": EnergyLevel.RECHARGE,
    "bath": EnergyLevel.RECHARGE,
    "meditation": EnergyLevel.RECHARGE,
    "rest": EnergyLevel.RECHARGE,

    # Family/Social (usually low-medium energy)
    "family": EnergyLevel.LOW,
    "social": EnergyLevel.LOW,
}


# ============================================================================
# SCHEDULING CONSTRAINTS
# ============================================================================

class SchedulingConstraints:
    """Hard limits and rules for scheduling"""

    # Time boundaries
    EARLIEST_START = time(6, 0)  # 6am earliest
    LATEST_END = time(21, 0)  # 9pm latest (after recharge time)

    # Daily limits
    MAX_WORK_HOURS_PER_DAY = 12  # Maximum work hours
    MIN_BREAK_BETWEEN_TASKS = 5  # Minimum minutes between tasks
    DAILY_WALK_DURATION = 20  # Ensure 20min walk daily

    # Task duration constraints
    MIN_TASK_DURATION = 15  # Minimum 15min task
    MAX_TASK_DURATION = 180  # Maximum 3hr task (split longer ones)

    # Buffer times
    MORNING_BUFFER = 30  # 30min morning routine before first task
    EVENING_BUFFER = 30  # 30min evening wind down

    # Priority boost rules
    DEADLINE_URGENCY_DAYS = 2  # Tasks due in 2 days get priority boost
    CLIENT_WORK_ALWAYS_FIRST = True  # Client work always scheduled first


# ============================================================================
# PRIORITY SCORING FUNCTION
# ============================================================================

def calculate_priority_score(
    priority: Priority,
    days_until_deadline: int | None,
    estimated_duration: int,
    is_client_work: bool = False
) -> float:
    """
    Calculate a priority score for task scheduling.
    Higher score = scheduled first.

    Args:
        priority: Task priority level
        days_until_deadline: Days until deadline (None if no deadline)
        estimated_duration: Task duration in minutes
        is_client_work: Whether this is client delivery work

    Returns:
        Priority score (0-100)
    """
    # Base score from priority level (inverted so 1 = highest)
    base_score = 100 - (priority.value * 10)

    # Client work override
    if is_client_work or priority == Priority.CLIENT_DELIVERY:
        base_score = 100

    # Deadline urgency multiplier
    if days_until_deadline is not None:
        if days_until_deadline <= 0:
            base_score += 50  # Overdue - massive boost
        elif days_until_deadline <= SchedulingConstraints.DEADLINE_URGENCY_DAYS:
            base_score += 30  # Due soon - significant boost
        elif days_until_deadline <= 7:
            base_score += 15  # Due this week - moderate boost

    # Duration penalty (slightly prefer shorter tasks for momentum)
    duration_penalty = min(estimated_duration / 60, 3) * 2  # Max -6 points
    base_score -= duration_penalty

    return max(0, min(100, base_score))  # Clamp to 0-100


# ============================================================================
# AI PROMPTS FOR GPT-4
# ============================================================================

SCHEDULING_SYSTEM_PROMPT = """You are an expert scheduling assistant for a busy founder and student.

**User Profile:**
- Founder running an AI agency (primary income)
- Full-time student (non-negotiable commitment)
- Trains Muay Thai 2x/week
- Values family time and personal growth

**Priority Rules (STRICT ORDER):**
1. Client Delivery Work - ALWAYS comes first, non-negotiable
2. Outbound & New Client Generation - Revenue-driving activity
3. Founder Work (GTM, product, strategy) - Business growth
4. Fitness & Sports - Health is non-negotiable
5. School Work - Academic commitment
6. Family Time - Important but flexible
7. Social & Errands - Lowest priority

**Energy Matching:**
- High energy work (client, founder work) → Morning blocks or early afternoon
- Medium energy (outreach, content) → Post-lunch, late afternoon
- Low energy (school work, admin) → Evening or fragmented time
- Recharge (walks, baths) → Must happen daily

**Scheduling Philosophy:**
- Client work gets the BEST time slots (morning deep work)
- Protect deep work blocks - no fragmentation
- School work fits in low-energy gaps
- Daily walk is non-negotiable (20min minimum)
- Batch similar tasks together
- Leave buffer time between context switches

When scheduling, think like a founder: revenue-driving activities get prime time.
"""

REBALANCE_PROMPT = """A schedule disruption occurred. Rebalance the remaining tasks for today/this week.

**Rules:**
1. Protect client delivery work - reschedule other things first
2. Keep high-priority tasks, defer low-priority
3. Maintain energy matching (don't put deep work in tired slots)
4. Suggest which tasks to move to tomorrow/next week
5. Be realistic - don't overpack the day

Provide a clear rebalancing plan with reasoning.
"""
