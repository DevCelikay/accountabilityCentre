# Accountability Centre - Project Plan

## Overview
A web application for task management, habit tracking, and accountability to help prevent slip-ups on bad vices while maintaining productivity.

## Core Features

### 1. Task Management System
**Task Properties:**
- Title (required)
- Description
- Priority (Low, Medium, High, Urgent)
- Status (Todo, In Progress, Completed, Blocked)
- Due Date
- Created Date
- Completed Date
- Tags/Categories
- Client Assignment (required for grouping)
- Estimated Time
- Actual Time Spent
- Notes/Comments

**Client Grouping:**
- All tasks must belong to a client
- Clients can represent: actual clients, personal projects, life areas, etc.
- Client properties: name, color code, description, active/archived status

**Bulk Task Input:**
- Paste multi-line text
- AI/parser breaks it into individual tasks
- Assigns to selected client
- Smart detection of priorities, dates from text
- Preview before confirming

### 2. Habit & Vice Tracking System

**Behavior Types:**
- **Good Habits** (things to do): exercise, reading, meditation, etc.
- **Bad Vices** (things to avoid): smoking, excessive screen time, junk food, etc.

**Tracking Features:**
- Daily check-ins
- Streak counter (consecutive days)
- Slip-up counter with timestamps
- Notes on each entry (triggers, feelings, context)
- Weekly/monthly statistics
- Visual progress charts

**Record Structure:**
- Behavior name
- Type (habit/vice)
- Goal (daily, weekly frequency)
- Current streak
- Best streak
- Total slip-ups
- History log with timestamps and notes

### 3. Notification & Reminder System

**Notification Types:**
- Task due date reminders
- Habit check-in reminders (scheduled times)
- Daily review prompts
- Weekly accountability review
- Streak milestone celebrations
- Custom reminders

**Schedule Options:**
- One-time
- Daily (specific times)
- Weekly (specific days/times)
- Custom intervals
- Smart reminders (before due dates)

**Delivery:**
- Desktop notifications (browser API)
- Mobile notifications (PWA)
- In-app notification center

### 4. Accountability Mechanisms

**Daily Review:**
- Morning: Today's tasks and habit goals
- Evening: What was accomplished, slip-ups, reflections

**Weekly Review:**
- Tasks completed vs planned
- Habit streaks status
- Slip-up analysis
- Wins and areas for improvement

**Consequences & Rewards:**
- Define consequences for slip-ups
- Reward milestones (7 days, 30 days, 90 days)
- Accountability score/points system

**Progress Tracking:**
- Completion rates
- Streak calendars
- Charts and graphs
- Personal insights

## Technical Architecture

### Tech Stack
**Frontend:**
- React 18+ (with Hooks)
- TypeScript (for type safety)
- Tailwind CSS (for styling)
- React Router (for navigation)
- Recharts (for data visualization)
- date-fns (for date handling)

**State Management:**
- React Context + useReducer (lightweight)
- Or Zustand (if needed)

**Storage:**
- IndexedDB (via Dexie.js) - structured local storage
- LocalStorage - for preferences
- Future: Can migrate to backend API

**Notifications:**
- Service Worker + Push API
- Notification API
- Background Sync API

**Build Tools:**
- Vite (fast, modern bundler)
- PWA plugin for offline support

### Project Structure
```
accountabilityCentre/
├── public/
│   ├── manifest.json (PWA manifest)
│   └── service-worker.js
├── src/
│   ├── components/
│   │   ├── tasks/
│   │   ├── habits/
│   │   ├── clients/
│   │   ├── notifications/
│   │   └── common/
│   ├── hooks/
│   ├── services/
│   │   ├── db.ts (IndexedDB setup)
│   │   ├── notifications.ts
│   │   └── taskParser.ts (bulk input)
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```

### Data Schema

**Clients:**
```typescript
interface Client {
  id: string;
  name: string;
  color: string;
  description?: string;
  isArchived: boolean;
  createdAt: Date;
}
```

**Tasks:**
```typescript
interface Task {
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
```

**Behaviors (Habits/Vices):**
```typescript
interface Behavior {
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
```

**Behavior Records:**
```typescript
interface BehaviorRecord {
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
```

**Notifications:**
```typescript
interface NotificationSchedule {
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
```

## Implementation Phases

### Phase 1: MVP Core (Week 1)
- [ ] Project setup (Vite + React + TypeScript + Tailwind)
- [ ] IndexedDB setup with Dexie.js
- [ ] Basic client management (CRUD)
- [ ] Basic task management (CRUD)
- [ ] Task-client relationship
- [ ] Simple list views

### Phase 2: Enhanced Task Features (Week 1-2)
- [ ] Bulk task input parser
- [ ] Task filtering and sorting
- [ ] Task status updates
- [ ] Due date management
- [ ] Priority system
- [ ] Task details view

### Phase 3: Habit Tracking (Week 2)
- [ ] Behavior management (CRUD)
- [ ] Daily check-ins
- [ ] Slip-up logging
- [ ] Streak calculations
- [ ] History records
- [ ] Basic statistics

### Phase 4: Notifications (Week 2-3)
- [ ] Service Worker setup
- [ ] Notification permission handling
- [ ] Desktop notifications
- [ ] Scheduled reminders
- [ ] Notification settings

### Phase 5: Accountability & Analytics (Week 3)
- [ ] Daily review interface
- [ ] Weekly review interface
- [ ] Charts and visualizations
- [ ] Progress tracking
- [ ] Insights dashboard

### Phase 6: PWA & Polish (Week 3-4)
- [ ] PWA manifest
- [ ] Offline support
- [ ] Mobile optimization
- [ ] Dark mode
- [ ] Onboarding flow
- [ ] Data export/import

## UI/UX Considerations

**Navigation:**
- Sidebar: Dashboard, Tasks, Habits, Clients, Reviews
- Quick action button (floating)

**Dashboard:**
- Today's tasks
- Habit check-in status
- Current streaks
- Upcoming reminders
- Quick stats

**Color Coding:**
- Clients have unique colors
- Priority levels have colors (red=urgent, orange=high, yellow=medium, green=low)
- Streaks shown with gradient (green=good, breaking towards red on risk)

**Mobile First:**
- Responsive design
- Touch-friendly buttons
- Swipe gestures for actions
- Bottom navigation for mobile

## Key User Flows

1. **Morning Routine:**
   - Notification: "Good morning! Here's your plan"
   - Open app → Dashboard shows today's tasks + habits to check
   - Check off morning habits
   - Review task list, set priorities

2. **Logging a Slip-Up:**
   - Quick action → Log slip-up
   - Select behavior
   - Add note (what triggered it?)
   - Streak resets, record saved
   - Show encouragement message

3. **Bulk Adding Tasks:**
   - Select client
   - Click "Bulk Add"
   - Paste list (from email, notes, etc.)
   - Preview parsed tasks
   - Confirm → Tasks created

4. **Evening Review:**
   - Notification: "Time for daily review"
   - Check off completed tasks
   - Log evening habits
   - Add reflection notes
   - See tomorrow's plan preview

## Success Metrics
- Tasks completed per day/week
- Habit streak lengths
- Reduced slip-up frequency over time
- Consistent daily reviews
- Time to complete tasks vs estimates

## Future Enhancements (Post-MVP)
- Cloud sync
- Accountability partner sharing
- AI insights and suggestions
- Integration with calendar
- Pomodoro timer
- Voice input for quick logging
- Browser extension
- Mobile native apps

---

## Next Steps
1. Review and approve this plan
2. Set up development environment
3. Initialize project with chosen tech stack
4. Start Phase 1 implementation
