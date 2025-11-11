# Accountability Centre - Setup Guide

Complete AI-powered scheduling system with Google Calendar integration.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.10+ (for backend)
- **OpenAI API Key** (for AI scheduling)
- **Google Cloud Project** (for Calendar integration)

---

## 📦 Backend Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add:

```env
# OpenAI API Key
OPENAI_API_KEY=sk-your-key-here

# Google OAuth2 (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/calendar/auth/callback

# Database
DATABASE_URL=sqlite:///./accountability.db

# API Settings
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Security (generate with: openssl rand -hex 32)
SECRET_KEY=your-random-secret-key-here
```

### 3. Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**
4. Create **OAuth 2.0 credentials** (Web application)
5. Add authorized redirect URI: `http://localhost:8000/calendar/auth/callback`
6. Copy Client ID and Client Secret to your `.env`

### 4. Start Backend Server

```bash
cd backend
python run.py
```

Backend will run at `http://localhost:8000`

API docs at `http://localhost:8000/docs`

---

## 🎨 Frontend Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` from the example:

```bash
cp .env.example .env
```

Content:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
npm run dev
```

Frontend will run at `http://localhost:5173`

---

## ✅ Verify Installation

### Check Backend Health

```bash
curl http://localhost:8000/health
```

Should return:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "google_calendar_connected": true,
  "openai_available": true,
  "database_healthy": true
}
```

### Test Frontend

1. Open `http://localhost:5173`
2. Navigate to "AI Calendar" in sidebar
3. Click "Connect Google Calendar"
4. Complete OAuth flow
5. Click "Sync" to import your calendar

---

## 🎯 Key Features

### 1. AI Scheduling

- Navigate to **AI Calendar**
- Click **"AI Schedule"** button
- Select tasks to schedule
- Choose optimization mode (Priority/Deadline/Balance)
- AI will find optimal time slots based on:
  - Your fixed blocks (school, Muay Thai, etc.)
  - Energy levels (high/medium/low)
  - Task priorities
  - Existing calendar events

### 2. Natural Language Input

- Click **"Quick Add"** button
- Type in plain English:
  - "schedule 30min deep work tomorrow morning"
  - "add 1 hour client call friday at 2pm"
  - "block 45min for gym tonight"
- AI parses and schedules automatically

### 3. Smart Rebalancing

- Click **"Rebalance Day"** when schedule gets disrupted
- AI intelligently reschedules flexible tasks
- Prioritizes client work, preserves fixed blocks

### 4. Google Calendar Sync

- Bidirectional sync with Google Calendar
- Events from Google appear in AI Calendar
- AI-scheduled tasks can be pushed to Google

---

## 🧠 Your Personal Configuration

Your scheduling rules are in `backend/app/core/scheduling_config.py`:

### Priority Order (hardcoded for you):
1. Client Delivery Work
2. Outbound & New Client Generation
3. Deep Work / Founder Work
4. Gym / Fitness / Sports
5. School Work / Revision
6. Family Time
7. Social / Errands

### Fixed Blocks:
- **Monday**: 8am-4pm School
- **Tuesday**: 8am-3:30pm School
- **Wednesday**: 10am-4pm School, 5pm-7pm Muay Thai
- **Thursday**: 8am-3:30pm School
- **Friday**: 8am-2:30pm School, 3:30pm-5:30pm Muay Thai
- **Saturday**: 2pm-6:30pm Saturday Job

### Energy Zones:
- **High Energy** → Client work, Founder work
- **Medium Energy** → Outreach, Social posts
- **Low Energy** → School work, Planning, Errands
- **Recharge** → Walks, Baths

To customize these, edit:
- `FIXED_BLOCKS` dictionary
- `get_energy_zones()` function
- `TASK_ENERGY_MAP` dictionary

---

## 📁 Project Structure

```
accountabilityCentre/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── core/              # Config & scheduling rules
│   │   │   ├── config.py      # Environment settings
│   │   │   └── scheduling_config.py  # YOUR RULES
│   │   ├── models/            # Database models
│   │   ├── services/          # Business logic
│   │   │   ├── constraint_solver.py   # OR-Tools optimizer
│   │   │   ├── ai_scheduler.py        # OpenAI GPT-4
│   │   │   └── google_calendar.py     # Google API
│   │   ├── routers/           # API endpoints
│   │   └── main.py            # FastAPI app
│   ├── requirements.txt
│   ├── .env                   # Config (create this)
│   └── run.py
│
├── src/                       # React TypeScript frontend
│   ├── components/
│   │   ├── calendar/          # AI Calendar UI
│   │   │   ├── CalendarPage.tsx
│   │   │   ├── CalendarView.tsx
│   │   │   ├── AIScheduler.tsx
│   │   │   └── NaturalLanguageInput.tsx
│   │   ├── tasks/             # Task management
│   │   ├── habits/            # Habit tracking
│   │   └── clients/           # Client grouping
│   ├── services/
│   │   ├── api.ts             # Backend API client
│   │   └── db.ts              # IndexedDB (Dexie)
│   └── App.tsx
│
├── package.json
├── .env                       # Frontend config
└── SETUP.md                   # This file
```

---

## 🔧 Troubleshooting

### "OpenAI API key not found"
- Make sure `OPENAI_API_KEY` is set in `backend/.env`
- Restart the backend server

### "Google Calendar not connected"
1. Visit `/calendar` in the app
2. Click "Connect Google Calendar"
3. Complete OAuth flow
4. If redirect fails, check redirect URI in Google Cloud Console

### "No available slots"
- Your fixed blocks may be consuming all available time
- Adjust constraints in `backend/app/core/scheduling_config.py`
- Try "This Week" or "This Month" instead of "Today"

### Backend won't start
```bash
cd backend
pip install --upgrade -r requirements.txt
python run.py
```

### Frontend build errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 🎨 Usage Examples

### Schedule a Task with AI

1. Go to **Tasks** page
2. Add a task (e.g., "Client proposal review")
3. Go to **AI Calendar**
4. Click **"AI Schedule"**
5. Select the task
6. Choose "Priority" optimization
7. Click "Schedule 1 Task"

AI will:
- Find optimal time based on energy level
- Avoid fixed blocks
- Respect your priorities
- Provide reasoning for the choice

### Use Natural Language

1. Go to **AI Calendar**
2. Click **"Quick Add"**
3. Type: "schedule 2 hours deep work saturday morning"
4. Click **"Parse with AI"**
5. Review parsed task
6. Click **"Schedule It"**

### Rebalance When Interrupted

1. Something urgent comes up during the day
2. Go to **AI Calendar**
3. Click **"Rebalance Day"**
4. AI reschedules flexible tasks
5. Prioritizes client work, defers low-priority items

---

## 📊 API Endpoints

### Health
- `GET /health` - Check system status

### Calendar
- `GET /calendar/auth/url` - Get Google OAuth URL
- `POST /calendar/auth/callback` - OAuth callback
- `POST /calendar/sync` - Sync with Google
- `GET /calendar/events` - Get calendar events

### Scheduling
- `POST /schedule/task` - Schedule single task
- `POST /schedule/bulk` - Schedule multiple tasks
- `POST /schedule/rebalance` - Rebalance schedule

### AI
- `POST /ai/parse` - Parse natural language
- `GET /ai/insights` - Get scheduling insights
- `GET /ai/weekly-preview` - Preview upcoming week

Full API docs: `http://localhost:8000/docs`

---

## 🚀 Production Deployment

### Backend (Python)

Deploy to:
- **Railway** (easiest)
- **Heroku**
- **DigitalOcean App Platform**
- **AWS Lambda** (with Mangum adapter)

Update `.env`:
- Set `DATABASE_URL` to PostgreSQL (recommended for production)
- Use secure `SECRET_KEY`
- Update `CORS_ORIGINS` to your frontend URL

### Frontend (React)

Deploy to:
- **Vercel** (recommended)
- **Netlify**
- **Cloudflare Pages**

Update environment variable:
- `VITE_API_URL=https://your-backend.com`

Build:
```bash
npm run build
```

---

## 💡 Tips

1. **Start with small batches** - Schedule 3-5 tasks at a time initially
2. **Review AI decisions** - Check the reasoning to understand the logic
3. **Adjust energy zones** - Customize based on your actual productivity patterns
4. **Use natural language** - Faster than filling forms
5. **Sync regularly** - Keep Google Calendar in sync for best results
6. **Trust the rebalancing** - AI is good at juggling priorities

---

## 🐛 Known Issues

- First-time OAuth may require multiple attempts
- Calendar view doesn't support drag-to-reschedule yet (coming soon)
- Mobile responsive design needs improvement

---

## 📝 License

This is your personal accountability system. Use it however you want!

---

Built with ❤️ using FastAPI, React, GPT-4, and OR-Tools
