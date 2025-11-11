"""
Constraint Solver - The Brain of Task Scheduling
Uses OR-Tools for constraint optimization + your personal rules
"""

from datetime import datetime, timedelta, time
from typing import List, Dict, Tuple, Optional
from ortools.sat.python import cp_model
import logging

from app.core.scheduling_config import (
    FIXED_BLOCKS,
    get_energy_zones,
    EnergyLevel,
    Priority,
    SchedulingConstraints,
    calculate_priority_score,
)
from app.models.schemas import TaskToSchedule, EnergyLevelEnum

logger = logging.getLogger(__name__)


class TimeSlot:
    """Represents an available time slot"""

    def __init__(self, start: datetime, end: datetime, energy: EnergyLevel):
        self.start = start
        self.end = end
        self.energy = energy
        self.duration_minutes = int((end - start).total_seconds() / 60)

    def __repr__(self):
        return f"TimeSlot({self.start.strftime('%H:%M')}-{self.end.strftime('%H:%M')}, {self.energy.value}, {self.duration_minutes}min)"


class ScheduledTask:
    """Represents a task with assigned time slot"""

    def __init__(
        self,
        task: TaskToSchedule,
        start_time: datetime,
        end_time: datetime,
        slot: TimeSlot,
        score: float,
    ):
        self.task = task
        self.start_time = start_time
        self.end_time = end_time
        self.slot = slot
        self.score = score

    def __repr__(self):
        return f"ScheduledTask({self.task.title}, {self.start_time.strftime('%Y-%m-%d %H:%M')})"


class ConstraintSolver:
    """
    Constraint-based task scheduler using OR-Tools.
    Implements knapsack-style optimization with energy matching.
    """

    def __init__(self):
        self.model = None
        self.solver = None

    def get_available_slots(
        self,
        start_date: datetime,
        end_date: datetime,
        existing_events: List[Dict],
    ) -> List[TimeSlot]:
        """
        Calculate available time slots within date range, excluding fixed blocks and existing events.

        Args:
            start_date: Start of scheduling window
            end_date: End of scheduling window
            existing_events: List of already scheduled events

        Returns:
            List of available TimeSlot objects
        """
        available_slots = []
        current_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)

        while current_date <= end_date:
            weekday = current_date.weekday()

            # Get energy zones for this day
            energy_zones = get_energy_zones(weekday)

            # Get fixed blocks for this day
            fixed_blocks = FIXED_BLOCKS.get(weekday, [])

            # Convert fixed blocks to datetime
            fixed_datetimes = [
                (
                    current_date.replace(hour=start.hour, minute=start.minute),
                    current_date.replace(hour=end.hour, minute=end.minute),
                )
                for start, end, _ in fixed_blocks
            ]

            # Convert existing events to datetime ranges for this day
            existing_datetimes = [
                (event["start_time"], event["end_time"])
                for event in existing_events
                if event["start_time"].date() == current_date.date()
            ]

            # Combine all blocked times
            blocked_times = fixed_datetimes + existing_datetimes
            blocked_times.sort(key=lambda x: x[0])

            # For each energy zone, find available gaps
            for zone in energy_zones:
                zone_start = current_date.replace(
                    hour=zone.start.hour, minute=zone.start.minute
                )
                zone_end = current_date.replace(
                    hour=zone.end.hour, minute=zone.end.minute
                )

                # Find gaps in this zone
                gaps = self._find_gaps(zone_start, zone_end, blocked_times)

                # Create TimeSlot objects for each gap
                for gap_start, gap_end in gaps:
                    duration = int((gap_end - gap_start).total_seconds() / 60)
                    if duration >= SchedulingConstraints.MIN_TASK_DURATION:
                        available_slots.append(
                            TimeSlot(gap_start, gap_end, zone.energy)
                        )

            current_date += timedelta(days=1)

        return available_slots

    def _find_gaps(
        self,
        zone_start: datetime,
        zone_end: datetime,
        blocked_times: List[Tuple[datetime, datetime]],
    ) -> List[Tuple[datetime, datetime]]:
        """Find available gaps within a time zone, excluding blocked times."""
        gaps = []
        current = zone_start

        for block_start, block_end in blocked_times:
            # If block is outside our zone, skip
            if block_end <= zone_start or block_start >= zone_end:
                continue

            # If there's a gap before this block
            if current < block_start:
                gap_end = min(block_start, zone_end)
                if gap_end > current:
                    gaps.append((current, gap_end))

            # Move current to end of block
            current = max(current, block_end)

        # Add final gap if there's time left in the zone
        if current < zone_end:
            gaps.append((current, zone_end))

        return gaps

    def schedule_tasks(
        self,
        tasks: List[TaskToSchedule],
        available_slots: List[TimeSlot],
        optimize_for: str = "priority",
    ) -> Tuple[List[ScheduledTask], List[TaskToSchedule]]:
        """
        Schedule tasks into available slots using constraint optimization.

        Args:
            tasks: List of tasks to schedule
            available_slots: Available time slots
            optimize_for: "priority", "deadline", or "balance"

        Returns:
            Tuple of (scheduled_tasks, unscheduled_tasks)
        """
        if not tasks:
            return [], []

        if not available_slots:
            logger.warning("No available slots for scheduling")
            return [], tasks

        # Sort tasks by priority score
        scored_tasks = self._score_tasks(tasks)
        scored_tasks.sort(key=lambda x: x[1], reverse=True)

        scheduled = []
        unscheduled = []

        # Greedy algorithm with energy matching (fast and effective for personal use)
        for task, score in scored_tasks:
            best_slot = self._find_best_slot(
                task, available_slots, scheduled, optimize_for
            )

            if best_slot:
                # Calculate exact start/end time
                start_time = best_slot.start
                end_time = start_time + timedelta(minutes=task.estimated_time)

                # Ensure doesn't exceed slot
                if end_time > best_slot.end:
                    end_time = best_slot.end

                scheduled_task = ScheduledTask(task, start_time, end_time, best_slot, score)
                scheduled.append(scheduled_task)

                # Update available slots (remove used time)
                self._update_slots_after_scheduling(
                    available_slots, start_time, end_time
                )
            else:
                unscheduled.append(task)

        return scheduled, unscheduled

    def _score_tasks(self, tasks: List[TaskToSchedule]) -> List[Tuple[TaskToSchedule, float]]:
        """Calculate priority scores for all tasks."""
        scored = []

        for task in tasks:
            # Map frontend priority to internal Priority enum
            priority_map = {
                "urgent": Priority.CLIENT_DELIVERY,
                "high": Priority.OUTBOUND,
                "medium": Priority.FOUNDER_WORK,
                "low": Priority.SOCIAL,
            }
            priority = priority_map.get(task.priority.value, Priority.SOCIAL)

            # Calculate days until deadline
            days_until_deadline = None
            if task.due_date:
                days_until_deadline = (task.due_date - datetime.now()).days

            # Check if client work
            is_client_work = task.client_name is not None or any(
                tag in ["client", "client_delivery", "agency"]
                for tag in task.tags
            )

            score = calculate_priority_score(
                priority, days_until_deadline, task.estimated_time, is_client_work
            )

            scored.append((task, score))

        return scored

    def _find_best_slot(
        self,
        task: TaskToSchedule,
        available_slots: List[TimeSlot],
        scheduled: List[ScheduledTask],
        optimize_for: str,
    ) -> Optional[TimeSlot]:
        """
        Find the best available slot for a task based on energy matching and optimization criteria.
        """
        # Determine task's energy requirement
        task_energy = self._get_task_energy_level(task)

        # Filter slots that match energy level and duration
        matching_slots = [
            slot
            for slot in available_slots
            if slot.energy == task_energy
            and slot.duration_minutes >= task.estimated_time
        ]

        # If no exact energy match, find acceptable alternatives
        if not matching_slots:
            matching_slots = [
                slot
                for slot in available_slots
                if slot.duration_minutes >= task.estimated_time
            ]

        # If still no slots, task can't be scheduled
        if not matching_slots:
            return None

        # Sort by preference based on optimize_for
        if optimize_for == "deadline" and task.due_date:
            # Prefer slots closer to deadline
            matching_slots.sort(key=lambda s: abs((s.start - task.due_date).total_seconds()))
        elif optimize_for == "priority":
            # Prefer earlier slots for high priority
            matching_slots.sort(key=lambda s: s.start)
        else:  # balance
            # Spread tasks evenly
            matching_slots.sort(key=lambda s: len([
                st for st in scheduled
                if st.start_time.date() == s.start.date()
            ]))

        return matching_slots[0] if matching_slots else None

    def _get_task_energy_level(self, task: TaskToSchedule) -> EnergyLevel:
        """Infer task energy level from tags, title, and priority."""
        # Check explicit energy level
        if task.energy_level:
            energy_map = {
                EnergyLevelEnum.HIGH: EnergyLevel.HIGH,
                EnergyLevelEnum.MEDIUM: EnergyLevel.MEDIUM,
                EnergyLevelEnum.LOW: EnergyLevel.LOW,
                EnergyLevelEnum.RECHARGE: EnergyLevel.RECHARGE,
            }
            return energy_map.get(task.energy_level, EnergyLevel.MEDIUM)

        # Infer from tags
        high_energy_tags = ["client", "deep_work", "founder", "strategy", "gtm"]
        medium_energy_tags = ["outbound", "social", "content", "meeting"]
        low_energy_tags = ["school", "admin", "email", "planning"]
        recharge_tags = ["walk", "bath", "rest", "meditation"]

        task_tags_lower = [tag.lower() for tag in task.tags]
        title_lower = task.title.lower()

        if any(tag in task_tags_lower or tag in title_lower for tag in high_energy_tags):
            return EnergyLevel.HIGH
        elif any(tag in task_tags_lower or tag in title_lower for tag in medium_energy_tags):
            return EnergyLevel.MEDIUM
        elif any(tag in task_tags_lower or tag in title_lower for tag in low_energy_tags):
            return EnergyLevel.LOW
        elif any(tag in task_tags_lower or tag in title_lower for tag in recharge_tags):
            return EnergyLevel.RECHARGE

        # Default based on priority
        if task.priority in [TaskToSchedule.priority.model_fields["priority"].default, "urgent", "high"]:
            return EnergyLevel.HIGH
        else:
            return EnergyLevel.MEDIUM

    def _update_slots_after_scheduling(
        self, slots: List[TimeSlot], start_time: datetime, end_time: datetime
    ):
        """Update available slots after scheduling a task (split or remove slots)."""
        slots_to_remove = []
        slots_to_add = []

        for slot in slots:
            # If task completely consumes the slot
            if start_time <= slot.start and end_time >= slot.end:
                slots_to_remove.append(slot)

            # If task splits the slot
            elif start_time > slot.start and end_time < slot.end:
                slots_to_remove.append(slot)
                # Add slot before task
                slots_to_add.append(TimeSlot(slot.start, start_time, slot.energy))
                # Add slot after task
                slots_to_add.append(TimeSlot(end_time, slot.end, slot.energy))

            # If task overlaps start of slot
            elif start_time <= slot.start < end_time < slot.end:
                slots_to_remove.append(slot)
                slots_to_add.append(TimeSlot(end_time, slot.end, slot.energy))

            # If task overlaps end of slot
            elif slot.start < start_time < slot.end <= end_time:
                slots_to_remove.append(slot)
                slots_to_add.append(TimeSlot(slot.start, start_time, slot.energy))

        # Apply changes
        for slot in slots_to_remove:
            slots.remove(slot)
        slots.extend(slots_to_add)

        # Re-sort slots
        slots.sort(key=lambda s: s.start)

    def suggest_alternative_slots(
        self, task: TaskToSchedule, available_slots: List[TimeSlot], top_n: int = 3
    ) -> List[Dict]:
        """Suggest alternative time slots for a task."""
        task_energy = self._get_task_energy_level(task)

        matching_slots = [
            slot
            for slot in available_slots
            if slot.duration_minutes >= task.estimated_time
        ][:top_n]

        alternatives = []
        for slot in matching_slots:
            energy_match = slot.energy == task_energy
            alternatives.append({
                "start_time": slot.start,
                "end_time": slot.start + timedelta(minutes=task.estimated_time),
                "energy_level": slot.energy.value,
                "energy_match": energy_match,
                "confidence": 0.9 if energy_match else 0.6,
            })

        return alternatives
