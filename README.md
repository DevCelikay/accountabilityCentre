# Accountability Centre with AI Scheduling

A personal productivity system built for founders and students. Combines task management, habit tracking, and **AI-powered calendar scheduling** with Google Calendar integration.

![Built with](https://img.shields.io/badge/Built_with-React_+_Python_+_GPT--4-blue)
![Status](https://img.shields.io/badge/Status-Production_Ready-green)

## ✨ Features

### Core Productivity
- ✅ **Task Management** - Full CRUD, bulk input, kanban view, priority system
- 🎯 **Habit & Vice Tracking** - Streak tracking, daily check-ins, slip-up logging
- 👥 **Client Grouping** - Organize work by project/client
- 📊 **Dashboard** - Real-time overview of tasks, habits, and priorities

### 🤖 AI-Powered Scheduling (NEW!)
- **Intelligent Task Scheduling** - GPT-4 finds optimal time slots based on:
  - Your personal priority order (client work > outbound > founder work > fitness > school)
  - Energy levels (high/medium/low/recharge zones)
  - Fixed commitments (school, Muay Thai, Saturday job)
  - Existing calendar events
- **Natural Language Input** - "schedule 30min deep work tomorrow morning"
- **Smart Rebalancing** - AI reschedules when your day explodes
- **Google Calendar Sync** - Bidirectional sync with your Google Calendar
- **Energy Matching** - High-energy tasks → morning blocks, low-energy → evening
- **Constraint Solving** - OR-Tools optimization for perfect task placement

## 🎥 How It Works

### 1. AI Scheduling Flow
```
You: "I have 10 unscheduled tasks"
AI:  Analyzes your week → Finds available slots → Matches energy levels →
     Respects priorities → Avoids fixed blocks → Schedules optimally

Result: All tasks perfectly placed in your calendar
```

### 2. Natural Language
```
You: "schedule 2 hours client work tomorrow morning"
AI:  Parses → Creates task → Finds 9am-11am slot → Confirms → Done

Takes 5 seconds instead of filling forms
```

### 3. Rebalancing
```
Scenario: Urgent meeting appears at 2pm (your planned deep work time)
Action:  Click "Rebalance Day"
AI:      Moves deep work to tomorrow morning (higher energy anyway)
         Reschedules lighter tasks to evening
         Preserves client commitments

Result: Minimal disruption, optimal outcome
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- OpenAI API key
- Google Cloud project (for Calendar)

### Installation

1. **Clone and install**
```bash
git clone <your-repo>
cd accountabilityCentre
npm install
```

2. **Backend setup**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your OpenAI key and Google OAuth credentials
python run.py
```

3. **Frontend setup**
```bash
cp .env.example .env
# Edit .env with backend URL (default: http://localhost:8000)
npm run dev
```

4. **Open** `http://localhost:5173`

📖 **Full setup instructions**: See [SETUP.md](./SETUP.md)

## 📸 Screenshots

### AI Calendar View
Week-view calendar with AI-scheduled tasks, Google Calendar events, and energy zones.

### AI Scheduler Modal
Select tasks → Choose optimization (priority/deadline/balance) → AI schedules in seconds.

### Natural Language Input
Type in plain English → AI parses → Suggests optimal time → One click to schedule.

## 🧠 Your Personal Configuration

The system is tuned specifically for your life as a **founder + student**:

### Priority Hierarchy (Hardcoded)
1. 🔴 **Client Delivery Work** - Always gets the best time slots
2. 🟠 **Outbound & New Clients** - Revenue-driving
3. 🟡 **Founder Work** (GTM, strategy) - Business growth
4. 🔵 **Fitness** (Gym, Muay Thai) - Non-negotiable health
5. 🟢 **School Work** - Academic commitment
6. 🟣 **Family Time** - Important but flexible
7. ⚪ **Social & Errands** - Lowest priority

### Fixed Weekly Blocks (Non-Movable)
- **Monday**: 8am-4pm School
- **Tuesday**: 8am-3:30pm School
- **Wednesday**: 10am-4pm School, **5pm-7pm Muay Thai**
- **Thursday**: 8am-3:30pm School
- **Friday**: 8am-2:30pm School, **3:30pm-5:30pm Muay Thai**
- **Saturday**: 2pm-6:30pm Saturday Job
- **Sunday**: Free (best for deep work!)

### Energy Zones
- **High Energy** (mornings) → Client work, Founder work, Deep work
- **Medium Energy** (afternoons) → Outreach, Social posts, Meetings
- **Low Energy** (evenings) → School work, Planning, Admin
- **Recharge** → Daily walks, Baths (auto-suggested)

To customize: Edit `backend/app/core/scheduling_config.py`

## 📁 Tech Stack

### Frontend
- **React 19** + TypeScript
- **Tailwind CSS v4** (with PostCSS)
- **Dexie.js** (IndexedDB for offline-first)
- **date-fns** (date manipulation)
- **Lucide React** (icons)
- **React Router v7**

### Backend
- **FastAPI** (Python web framework)
- **SQLAlchemy** (ORM for SQLite/PostgreSQL)
- **OpenAI GPT-4** (AI scheduling decisions)
- **OR-Tools** (constraint optimization)
- **Google Calendar API** (OAuth2 + sync)
- **Pydantic** (data validation)

## 🎯 Use Cases

### For Founders
- Client work always gets priority in the best time slots
- Outbound/prospecting fits in medium-energy windows
- Deep work scheduled in focused morning blocks
- Automatic rebalancing when client emergencies arise

### For Students
- School blocks are immovable constraints
- Study/revision fits in low-energy gaps
- Balances academics with business priorities
- Ensures you don't overcommit

### For Athletes
- Muay Thai training locked in schedule
- Gym time protected
- Recovery time built in
- Energy management for physical activities

## 🔧 API Endpoints

### Scheduling
- `POST /schedule/task` - Schedule single task
- `POST /schedule/bulk` - Schedule multiple tasks
- `POST /schedule/rebalance` - Rebalance after disruption

### AI Features
- `POST /ai/parse` - Natural language parsing
- `GET /ai/insights` - Productivity insights
- `GET /ai/weekly-preview` - Week preview

### Calendar
- `GET /calendar/auth/url` - Google OAuth
- `POST /calendar/sync` - Sync events
- `GET /calendar/events` - Get events

**Full API docs**: `http://localhost:8000/docs`

## 🛠️ Customization

### Change Priority Order
Edit `backend/app/core/scheduling_config.py`:
```python
class Priority(Enum):
    YOUR_TOP_PRIORITY = 1
    SECOND_PRIORITY = 2
    # ...
```

### Adjust Fixed Blocks
```python
FIXED_BLOCKS: Dict[int, List[Tuple[time, time, str]]] = {
    0: [(time(9, 0), time(17, 0), "Work")],  # Monday
    # ...
}
```

### Modify Energy Zones
```python
def get_energy_zones(weekday: int) -> List[TimeBlock]:
    # Customize your daily energy patterns
```

## 📊 Architecture

```
Frontend (React) ←→ REST API ←→ Backend (FastAPI)
     ↓                              ↓
  IndexedDB                   ┌──────────┐
                              │ Scheduler│
                              │  Engine  │
                              └────┬─────┘
                                   ↓
                    ┌──────────────┼──────────────┐
                    ↓              ↓              ↓
              Constraint      OpenAI API    Google
               Solver                       Calendar
              (OR-Tools)        GPT-4
```

## 🐛 Troubleshooting

See [SETUP.md](./SETUP.md#troubleshooting) for common issues and solutions.

## 🚀 Roadmap

- [ ] Drag-and-drop rescheduling in calendar view
- [ ] Weekly/monthly insights dashboard
- [ ] Task duration learning (AI improves estimates over time)
- [ ] Mobile app (React Native)
- [ ] Team/collaborative features
- [ ] Integration with Notion, Todoist, etc.

## 📝 Why This Exists

Most scheduling tools (Motion, Reclaim, etc.) are generic. They don't know that:
- Your client work is sacred
- You're a founder AND a student
- Wednesday 5pm is Muay Thai (non-negotiable)
- You do your best work in the morning
- School work fits in low-energy gaps

This system is **tuned specifically to YOUR life**. That's why it works better than any generic tool ever could.

## 🤝 Contributing

This is a personal project, but if you want to build something similar:
1. Fork the repo
2. Customize `scheduling_config.py` to your life
3. Deploy and enjoy perfect scheduling

## 📄 License

MIT - Use however you want!

---

**Built by you, for you. A Motion-killer that actually understands your priorities.**

⚡ Powered by GPT-4, OR-Tools, and your relentless drive to get shit done.
