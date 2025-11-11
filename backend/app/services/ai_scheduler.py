"""
AI Scheduler - OpenAI GPT-4 Integration
Uses GPT-4 for intelligent scheduling decisions, natural language parsing, and rebalancing.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from openai import OpenAI

from app.core.config import settings
from app.core.scheduling_config import SCHEDULING_SYSTEM_PROMPT, REBALANCE_PROMPT
from app.models.schemas import (
    TaskToSchedule,
    ScheduleTaskResponse,
    RebalanceRequest,
    RebalanceResponse,
    NaturalLanguageScheduleRequest,
    TaskPriorityEnum,
    EnergyLevelEnum,
)

logger = logging.getLogger(__name__)


class AIScheduler:
    """
    AI-powered scheduling assistant using GPT-4.
    Handles natural language, context-aware scheduling, and rebalancing.
    """

    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4o"  # Using GPT-4 Turbo for speed + intelligence

    def parse_natural_language_task(
        self, text: str, context: Optional[Dict] = None
    ) -> Tuple[TaskToSchedule, datetime, float]:
        """
        Parse natural language input into a structured task with suggested time.

        Args:
            text: User input like "schedule 30min deep work tomorrow morning"
            context: Additional context (current time, existing tasks, etc.)

        Returns:
            Tuple of (parsed_task, suggested_time, confidence)
        """
        current_time = datetime.now()

        # Build context for GPT
        context_str = f"""
Current time: {current_time.strftime('%Y-%m-%d %H:%M')}
Current day: {current_time.strftime('%A')}

Parse the following task input and extract:
1. Task title
2. Duration (in minutes)
3. Priority (urgent/high/medium/low)
4. Suggested scheduling time
5. Tags/category
6. Energy level required

Input: "{text}"
"""

        if context:
            context_str += f"\n\nAdditional context: {json.dumps(context)}"

        messages = [
            {"role": "system", "content": SCHEDULING_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": context_str + "\n\nRespond with JSON only in this format:\n"
                "{\n"
                '  "title": "task title",\n'
                '  "duration_minutes": 30,\n'
                '  "priority": "high",\n'
                '  "suggested_time": "2024-01-15T09:00:00",\n'
                '  "tags": ["tag1", "tag2"],\n'
                '  "energy_level": "high",\n'
                '  "confidence": 0.9,\n'
                '  "interpretation": "What I understood from the input"\n'
                "}",
            },
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,  # Lower temperature for more consistent parsing
                response_format={"type": "json_object"},
            )

            result = json.loads(response.choices[0].message.content)

            # Create TaskToSchedule object
            task = TaskToSchedule(
                id=f"temp_{int(current_time.timestamp())}",
                title=result["title"],
                priority=TaskPriorityEnum(result["priority"]),
                estimated_time=result["duration_minutes"],
                tags=result.get("tags", []),
                energy_level=EnergyLevelEnum(result["energy_level"]),
            )

            suggested_time = datetime.fromisoformat(result["suggested_time"])
            confidence = result.get("confidence", 0.8)

            logger.info(f"Parsed task: {task.title} at {suggested_time}")
            return task, suggested_time, confidence

        except Exception as e:
            logger.error(f"Error parsing natural language task: {e}")
            # Fallback: create basic task
            fallback_task = TaskToSchedule(
                id=f"temp_{int(current_time.timestamp())}",
                title=text[:100],
                priority=TaskPriorityEnum.MEDIUM,
                estimated_time=30,
                tags=[],
            )
            return fallback_task, current_time + timedelta(hours=1), 0.3

    def enhance_scheduling_decision(
        self,
        task: TaskToSchedule,
        suggested_slot: datetime,
        alternative_slots: List[Dict],
        existing_schedule: List[Dict],
    ) -> Dict:
        """
        Use GPT-4 to validate and enhance scheduling decision.

        Args:
            task: Task to schedule
            suggested_slot: Suggested time from constraint solver
            alternative_slots: Other possible slots
            existing_schedule: Current day's schedule

        Returns:
            Enhanced decision with reasoning
        """
        messages = [
            {"role": "system", "content": SCHEDULING_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"""
I'm scheduling this task:
- Title: {task.title}
- Priority: {task.priority.value}
- Duration: {task.estimated_time} minutes
- Due date: {task.due_date if task.due_date else 'None'}
- Tags: {', '.join(task.tags)}

The constraint solver suggests: {suggested_slot.strftime('%A, %B %d at %H:%M')}

Alternative slots:
{json.dumps([{
    'time': alt['start_time'].strftime('%A, %B %d at %H:%M'),
    'energy': alt['energy_level']
} for alt in alternative_slots], indent=2)}

Current schedule for that day:
{json.dumps([{
    'title': evt.get('title', 'Event'),
    'time': evt.get('start_time').strftime('%H:%M') if isinstance(evt.get('start_time'), datetime) else evt.get('start_time')
} for evt in existing_schedule if evt.get('start_time')], indent=2)}

Questions:
1. Is the suggested time optimal for this task?
2. Should we use an alternative slot instead?
3. What's your reasoning?
4. Confidence score (0-1)?

Respond in JSON format:
{{
  "approve_suggestion": true/false,
  "recommended_time": "ISO timestamp or suggested_slot",
  "reasoning": "Your reasoning here",
  "confidence": 0.9,
  "considerations": ["consideration 1", "consideration 2"]
}}
""",
            },
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.5,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.choices[0].message.content)
            logger.info(f"AI enhanced decision: {result['reasoning']}")
            return result

        except Exception as e:
            logger.error(f"Error enhancing decision: {e}")
            return {
                "approve_suggestion": True,
                "recommended_time": suggested_slot.isoformat(),
                "reasoning": "Using constraint solver suggestion (AI unavailable)",
                "confidence": 0.7,
                "considerations": [],
            }

    def rebalance_schedule(
        self,
        request: RebalanceRequest,
        affected_tasks: List[Dict],
        available_slots: List[Dict],
    ) -> RebalanceResponse:
        """
        Use GPT-4 to intelligently rebalance schedule after disruption.

        Args:
            request: Rebalancing request with reason and scope
            affected_tasks: Tasks that need rescheduling
            available_slots: Available time slots

        Returns:
            Rebalancing plan with changes
        """
        messages = [
            {"role": "system", "content": SCHEDULING_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"""
Schedule disruption occurred:
Reason: {request.reason}
Date affected: {request.affected_date.strftime('%A, %B %d, %Y')}
Scope: {request.scope}

Tasks affected:
{json.dumps([{
    'title': task.get('title'),
    'priority': task.get('priority'),
    'duration': task.get('duration', 'unknown'),
    'current_time': task.get('scheduled_time', 'unscheduled')
} for task in affected_tasks], indent=2)}

Available slots:
{json.dumps([{
    'time': slot['start_time'].strftime('%A %H:%M') if isinstance(slot.get('start_time'), datetime) else 'N/A',
    'duration': slot.get('duration_minutes', 'unknown'),
    'energy': slot.get('energy', 'unknown')
} for slot in available_slots[:10]], indent=2)}

Tasks to preserve (cannot move):
{request.preserve_events}

Create a rebalancing plan that:
1. Prioritizes client delivery work
2. Keeps high-priority tasks
3. Defers low-priority tasks if needed
4. Maintains energy matching
5. Minimizes disruption

Respond in JSON:
{{
  "changes": [
    {{"task_id": "id", "action": "move/defer/keep", "new_time": "ISO or null", "reason": "why"}}
  ],
  "moved_tasks": ["task_id1", "task_id2"],
  "deferred_tasks": ["task_id3"],
  "reasoning": "Overall rebalancing strategy",
  "success": true/false
}}
""",
            },
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.6,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.choices[0].message.content)

            return RebalanceResponse(
                changes=result["changes"],
                moved_tasks=result["moved_tasks"],
                deferred_tasks=result["deferred_tasks"],
                reasoning=result["reasoning"],
                success=result["success"],
            )

        except Exception as e:
            logger.error(f"Error rebalancing schedule: {e}")
            return RebalanceResponse(
                changes=[],
                moved_tasks=[],
                deferred_tasks=[],
                reasoning=f"Error during rebalancing: {str(e)}",
                success=False,
            )

    def generate_scheduling_insights(
        self, schedule_history: List[Dict], completion_data: List[Dict]
    ) -> Dict:
        """
        Generate insights from scheduling patterns using GPT-4.

        Args:
            schedule_history: Past scheduled tasks
            completion_data: Task completion/rescheduling data

        Returns:
            Insights and recommendations
        """
        messages = [
            {"role": "system", "content": SCHEDULING_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"""
Analyze my scheduling patterns and provide insights:

Schedule history (last 30 days):
{json.dumps(schedule_history[:50], indent=2, default=str)}

Completion data:
{json.dumps(completion_data[:30], indent=2, default=str)}

Provide insights on:
1. Most productive times of day
2. Task duration estimation accuracy
3. Common scheduling conflicts
4. Energy pattern effectiveness
5. Recommendations for improvement

Respond in JSON:
{{
  "most_productive_times": [{{"time": "morning", "success_rate": 0.9}}],
  "duration_accuracy": 0.75,
  "common_conflicts": ["list of patterns"],
  "recommendations": ["actionable suggestions"],
  "energy_insights": {{"high_energy_effectiveness": 0.85}}
}}
""",
            },
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return {
                "most_productive_times": [],
                "duration_accuracy": 0.0,
                "common_conflicts": [],
                "recommendations": ["Unable to generate insights at this time"],
                "energy_insights": {},
            }

    def infer_task_category(self, task: TaskToSchedule) -> str:
        """
        Use GPT-4 to infer task category from title and description.

        Args:
            task: Task to categorize

        Returns:
            Category string (client_delivery, outbound, founder_work, etc.)
        """
        messages = [
            {
                "role": "system",
                "content": "You categorize tasks into: client_delivery, outbound, founder_work, fitness, school_work, family, social, errands.",
            },
            {
                "role": "user",
                "content": f"Title: {task.title}\nDescription: {task.description or 'None'}\nTags: {', '.join(task.tags)}\n\nCategory:",
            },
        ]

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Cheaper model for simple categorization
                messages=messages,
                temperature=0.2,
                max_tokens=20,
            )

            category = response.choices[0].message.content.strip().lower()
            return category

        except Exception as e:
            logger.error(f"Error inferring category: {e}")
            return "unknown"


# Singleton instance
ai_scheduler = AIScheduler()
