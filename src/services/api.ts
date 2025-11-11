/**
 * API Client for AI Scheduler Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_flexible: boolean;
  is_all_day: boolean;
  source: 'google_calendar' | 'manual' | 'ai_scheduled';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  energy_required?: 'high' | 'medium' | 'low' | 'recharge';
  ai_scheduled: boolean;
  ai_confidence_score?: number;
  ai_reasoning?: string;
  color?: string;
}

export interface TaskToSchedule {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_time: number;
  due_date?: string;
  tags: string[];
  client_name?: string;
  preferred_time?: string;
  energy_level?: 'high' | 'medium' | 'low' | 'recharge';
}

export interface ScheduleResponse {
  task_id: string;
  calendar_event_id: string;
  scheduled_start: string;
  scheduled_end: string;
  reasoning: string;
  confidence_score: number;
  alternative_slots: Array<{
    start_time: string;
    end_time: string;
    energy_level: string;
    energy_match: boolean;
    confidence: number;
  }>;
}

export interface NaturalLanguageResponse {
  parsed_task: TaskToSchedule;
  suggested_time: string;
  confidence: number;
  interpretation: string;
}

export interface WeeklyPreview {
  week_start: string;
  total_scheduled_hours: number;
  breakdown_by_priority: Record<string, number>;
  breakdown_by_category: Record<string, number>;
  available_slots: Array<{
    day: string;
    time: string;
    duration_minutes: number;
    energy: string;
  }>;
  recommended_tasks_to_schedule: string[];
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Health Check
  async healthCheck() {
    return this.request<{
      status: string;
      version: string;
      google_calendar_connected: boolean;
      openai_available: boolean;
      database_healthy: boolean;
    }>('/health');
  }

  // Google Calendar
  async getGoogleAuthUrl() {
    return this.request<{ auth_url: string }>('/calendar/auth/url');
  }

  async syncCalendar(fullSync: boolean = false) {
    return this.request<{
      events_synced: number;
      events_added: number;
      events_updated: number;
      last_sync_time: string;
    }>('/calendar/sync', {
      method: 'POST',
      body: JSON.stringify({ full_sync: fullSync }),
    });
  }

  async getCalendarEvents(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return this.request<CalendarEvent[]>(
      `/calendar/events?${params.toString()}`
    );
  }

  async getCalendarStatus() {
    return this.request<{
      connected: boolean;
      user_email?: string;
      calendar_id?: string;
      last_sync?: string;
      auto_schedule_enabled?: boolean;
    }>('/calendar/status');
  }

  // Scheduling
  async scheduleTask(
    task: TaskToSchedule,
    schedulingMode: 'auto' | 'suggest' | 'force' = 'auto',
    timeWindow: 'today' | 'week' | 'month' = 'week'
  ) {
    return this.request<ScheduleResponse>('/schedule/task', {
      method: 'POST',
      body: JSON.stringify({
        task,
        scheduling_mode: schedulingMode,
        time_window: timeWindow,
      }),
    });
  }

  async bulkScheduleTasks(
    tasks: TaskToSchedule[],
    optimizeFor: 'priority' | 'deadline' | 'balance' = 'priority',
    timeWindow: 'today' | 'week' | 'month' = 'week'
  ) {
    return this.request<{
      scheduled_tasks: ScheduleResponse[];
      unscheduled_tasks: Array<{ task_id: string; title: string; reason: string }>;
      optimization_summary: string;
    }>('/schedule/bulk', {
      method: 'POST',
      body: JSON.stringify({
        tasks,
        optimize_for: optimizeFor,
        time_window: timeWindow,
      }),
    });
  }

  async rebalanceSchedule(
    reason: string,
    affectedDate: string,
    scope: 'day' | 'week' = 'day',
    preserveEvents: string[] = []
  ) {
    return this.request<{
      changes: Array<{
        task_id: string;
        action: 'move' | 'defer' | 'keep';
        new_time?: string;
        reason: string;
      }>;
      moved_tasks: string[];
      deferred_tasks: string[];
      reasoning: string;
      success: boolean;
    }>('/schedule/rebalance', {
      method: 'POST',
      body: JSON.stringify({
        reason,
        affected_date: affectedDate,
        scope,
        preserve_events: preserveEvents,
      }),
    });
  }

  // AI Features
  async parseNaturalLanguage(text: string, context?: Record<string, any>) {
    return this.request<NaturalLanguageResponse>('/ai/parse', {
      method: 'POST',
      body: JSON.stringify({ text, context }),
    });
  }

  async getInsights() {
    return this.request<{
      most_productive_times: Array<{ time: string; success_rate: number }>;
      task_duration_accuracy: number;
      common_scheduling_conflicts: string[];
      recommendations: string[];
      energy_pattern_analysis: Record<string, any>;
    }>('/ai/insights');
  }

  async getWeeklyPreview() {
    return this.request<WeeklyPreview>('/ai/weekly-preview');
  }

  async categorizeTask(title: string, description: string = '') {
    return this.request<{ category: string; title: string }>('/ai/categorize', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  }

  // Calendar Event Management
  async updateCalendarEvent(eventId: string, updates: Partial<CalendarEvent>) {
    return this.request<CalendarEvent>(`/calendar/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteCalendarEvent(eventId: string) {
    return this.request<{ success: boolean; message: string }>(`/calendar/events/${eventId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new APIClient();
