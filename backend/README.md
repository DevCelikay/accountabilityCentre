# Accountability Centre - AI Scheduler Backend

Python + FastAPI backend with Google Calendar integration and OpenAI-powered intelligent scheduling.

## Features

- 🤖 **AI-Powered Scheduling** - GPT-4 makes intelligent scheduling decisions based on your priorities
- 📅 **Google Calendar Sync** - Bidirectional sync with your Google Calendar
- ⚡ **Constraint Solver** - Optimizes task placement using OR-Tools
- 🎯 **Energy Matching** - Schedules tasks based on your energy levels throughout the day
- 🔄 **Smart Rebalancing** - AI automatically rebalances your schedule when disruptions occur
- 💬 **Natural Language Input** - "schedule 30min deep work tomorrow morning"

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

- `OPENAI_API_KEY` - Your OpenAI API key
- `GOOGLE_CLIENT_ID` - Google OAuth2 client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth2 client secret
- `SECRET_KEY` - Random secret key for JWT (generate with `openssl rand -hex 32`)

### 3. Google Calendar OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth2 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:8000/calendar/auth/callback`
6. Copy Client ID and Client Secret to `.env`

### 4. Run the Server

```bash
python run.py
```

Or with uvicorn directly:

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## API Endpoints

### Health
- `GET /health` - Health check

### Calendar
- `GET /calendar/auth/url` - Get Google OAuth URL
- `POST /calendar/auth/callback` - OAuth callback
- `POST /calendar/sync` - Sync events from Google Calendar
- `GET /calendar/events` - Get calendar events
- `GET /calendar/status` - Get sync status

### Scheduling
- `POST /schedule/task` - Schedule a single task with AI
- `POST /schedule/bulk` - Schedule multiple tasks at once
- `POST /schedule/rebalance` - Rebalance schedule after disruption

### AI Features
- `POST /ai/parse` - Parse natural language task input
- `GET /ai/insights` - Get scheduling insights and patterns
- `GET /ai/weekly-preview` - Get upcoming week preview
- `POST /ai/categorize` - Categorize task automatically

## Your Personal Configuration

Your scheduling rules are defined in `app/core/scheduling_config.py`:

**Priority Order:**
1. Client Delivery Work
2. Outbound & New Client Generation
3. Deep Work / Founder Work
4. Gym / Fitness / Sports
5. School Work / Revision
6. Family Time
7. Social / Errands

**Fixed Blocks:**
- Monday: 8am-4pm School
- Tuesday: 8am-3:30pm School
- Wednesday: 10am-4pm School, 5pm-7pm Muay Thai
- Thursday: 8am-3:30pm School
- Friday: 8am-2:30pm School, 3:30pm-5:30pm Muay Thai
- Saturday: 2pm-6:30pm Saturday Job

**Energy Zones:**
- High Energy: Client work, Founder work
- Medium Energy: Outreach, Social media
- Low Energy: School work, Planning
- Recharge: Walks, Baths

## Architecture

```
backend/
├── app/
│   ├── core/               # Configuration
│   │   ├── config.py       # Environment settings
│   │   └── scheduling_config.py  # Your personal rules
│   ├── models/             # Database models
│   │   ├── database.py     # SQLAlchemy models
│   │   └── schemas.py      # Pydantic schemas
│   ├── services/           # Business logic
│   │   ├── constraint_solver.py   # OR-Tools optimizer
│   │   ├── ai_scheduler.py        # OpenAI integration
│   │   └── google_calendar.py     # Google Calendar API
│   ├── routers/            # API endpoints
│   │   ├── calendar.py     # Calendar operations
│   │   ├── scheduling.py   # Scheduling operations
│   │   ├── ai.py          # AI features
│   │   └── health.py      # Health checks
│   └── main.py            # FastAPI app
├── requirements.txt
├── run.py
└── README.md
```

## Database

Uses SQLite by default (`accountability.db`). Tables:

- `calendar_events` - All calendar events (Google + AI-scheduled)
- `scheduling_decisions` - AI decision history for learning
- `google_calendar_sync` - OAuth tokens and sync state
- `scheduling_patterns` - Learned patterns from user behavior

## Development

### Run with auto-reload
```bash
uvicorn app.main:app --reload
```

### Run tests (when added)
```bash
pytest
```

### Check API docs
Visit `http://localhost:8000/docs` for interactive Swagger UI

## Customization

To customize scheduling rules, edit `app/core/scheduling_config.py`:

- `FIXED_BLOCKS` - Your immovable weekly commitments
- `get_energy_zones()` - Your energy levels throughout the day
- `TASK_ENERGY_MAP` - Task type → energy level mapping
- `calculate_priority_score()` - Priority scoring algorithm

## Troubleshooting

**"OpenAI API key not found"**
- Make sure you've set `OPENAI_API_KEY` in `.env`

**"Google Calendar not connected"**
- Complete OAuth flow by visiting `/calendar/auth/url`
- Make sure redirect URI matches in Google Cloud Console

**"No available slots"**
- Check that your fixed blocks aren't consuming all available time
- Adjust `SchedulingConstraints` in `scheduling_config.py`

## Support

For issues or questions, check the main project README or create an issue.
