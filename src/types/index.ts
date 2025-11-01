// Core data types for Accountability Centre

export interface Client {
  id: string;
  name: string;
  color: string;
  description?: string;
  isArchived: boolean;
  createdAt: Date;
}

export interface Task {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'blocked';
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
  estimatedTime?: number; // minutes
  actualTime?: number; // minutes
  tags: string[];
  notes?: string;
}

export interface Behavior {
  id: string;
  name: string;
  type: 'habit' | 'vice';
  description?: string;
  goal: {
    frequency: 'daily' | 'weekly' | 'custom';
    target?: number; // e.g., 3 times per week
  };
  currentStreak: number;
  bestStreak: number;
  totalSlipUps: number;
  isActive: boolean;
  createdAt: Date;
  reminderTimes?: string[]; // ["09:00", "21:00"]
}

export interface BehaviorRecord {
  id: string;
  behaviorId: string;
  timestamp: Date;
  type: 'success' | 'slip_up';
  notes?: string;
  context?: {
    triggers?: string[];
    mood?: string;
    location?: string;
  };
}

export interface NotificationSchedule {
  id: string;
  type: 'task_reminder' | 'habit_reminder' | 'daily_review' | 'weekly_review' | 'custom';
  entityId?: string; // taskId or behaviorId
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'custom';
    time: string; // "HH:mm"
    days?: number[]; // [0-6] for weekly
    date?: Date; // for once
  };
  message: string;
  isEnabled: boolean;
}

export interface DailyReview {
  id: string;
  date: Date;
  type: 'morning' | 'evening';
  tasksCompleted: number;
  habitsChecked: string[]; // behavior IDs
  slipUps: string[]; // behavior IDs
  notes?: string;
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
}
