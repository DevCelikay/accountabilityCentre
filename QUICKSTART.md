# Quick Start Guide

Get up and running in 5 minutes.

## 🚀 First Time Setup

### 1. Get Your API Keys

**OpenAI API Key** (required for AI scheduling):
- Go to https://platform.openai.com/api-keys
- Create new key
- Copy it

**Google Calendar OAuth** (required for calendar sync):
- Go to https://console.cloud.google.com/
- Create project → Enable Google Calendar API
- Create OAuth 2.0 credentials (Web application)
- Add redirect URI: `http://localhost:8000/calendar/auth/callback`
- Copy Client ID and Secret

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
nano .env  # or open in your editor
```

Paste your keys:
```env
OPENAI_API_KEY=sk-your-key-here
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
SECRET_KEY=run-this-command-openssl-rand-hex-32
```

### 3. Install & Run

```bash
# From project root
./start.sh
```

That's it! Opens automatically at http://localhost:5173

## ✅ First Steps

### 1. Connect Google Calendar (2 minutes)
1. Click "AI Calendar" in sidebar
2. Click "Connect Google Calendar"
3. Complete OAuth (opens new window)
4. Click "Sync" when connected
5. Your Google events now appear!

### 2. Add Some Tasks (1 minute)
1. Go to "Tasks" page
2. Click "+ New Task"
3. Add 3-5 tasks with priorities
4. Set estimated time for each

### 3. Let AI Schedule Them (30 seconds)
1. Go back to "AI Calendar"
2. Click "AI Schedule" button
3. Select all tasks
4. Choose "Priority" optimization
5. Choose "This Week"
6. Click "Schedule 5 Tasks"

Watch AI place them perfectly in your calendar! ✨

### 4. Try Natural Language (10 seconds)
1. Click "Quick Add"
2. Type: "schedule 30min deep work tomorrow morning"
3. Click "Parse with AI"
4. Review → Click "Schedule It"

Done! Task scheduled instantly.

## 🎯 Daily Workflow

### Morning Routine
1. Open AI Calendar
2. Click "Sync" to get latest Google events
3. Review today's schedule
4. Add any new tasks that came up

### When Something Urgent Happens
1. Click "Rebalance Day"
2. AI reschedules everything intelligently
3. Client work stays protected, low-priority defers

### Quick Task Addition
1. Click "Quick Add"
2. Type in plain English
3. AI schedules it instantly

## 🧠 How AI Chooses Time Slots

The AI knows:

**Your Priorities** (hardcoded):
1. Client work > 2. Outbound > 3. Founder work > 4. Fitness > 5. School > 6. Family > 7. Social

**Your Fixed Blocks**:
- Monday: 8am-4pm School
- Tuesday: 8am-3:30pm School
- Wednesday: 10am-4pm School, 5pm-7pm Muay Thai
- Thursday: 8am-3:30pm School
- Friday: 8am-2:30pm School, 3:30pm-5:30pm Muay Thai
- Saturday: 2pm-6:30pm Job

**Your Energy Levels**:
- Morning (before school) = HIGH energy → Client work, Founder work
- Afternoon (after school) = MEDIUM energy → Outreach, Social posts
- Evening = LOW energy → School work, Planning
- Recharge time = Walks, Baths

**Rules**:
- Client work ALWAYS gets the best slots (morning deep work time)
- High-priority urgent tasks bump everything else
- Tasks match your energy (no deep work at 9pm)
- School blocks are immovable
- Muay Thai is sacred

## 💡 Pro Tips

### 1. Batch Similar Tasks
Instead of "Write email to client A", "Write email to client B"...
→ "Outbound emails batch (1 hour)"

AI will find one good block instead of fragmenting your calendar.

### 2. Use Tags for Auto-Categorization
- `#client` → AI treats as high priority
- `#deep_work` → AI schedules in morning
- `#school` → AI puts in evening/low-energy slots
- `#gym` → AI schedules around your energy

### 3. Set Realistic Durations
AI learns from your patterns. If you consistently underestimate, it will start to notice.

### 4. Trust the Rebalancing
When your day explodes, don't manually reschedule. Let AI do it. It's better at juggling priorities.

### 5. Review AI Reasoning
Click on scheduled events to see WHY AI put it there. Helps you understand the logic.

## 🔧 Customization

Want to change your schedule rules?

Edit: `backend/app/core/scheduling_config.py`

### Change Priority Order
```python
class Priority(Enum):
    WHATEVER_YOU_WANT_FIRST = 1
    SECOND_THING = 2
```

### Adjust Fixed Blocks
```python
FIXED_BLOCKS = {
    0: [(time(9, 0), time(17, 0), "Work")],  # Monday
}
```

### Modify Energy Zones
```python
zones.append(TimeBlock(time(6, 0), time(9, 0), EnergyLevel.HIGH, "Morning deep work"))
```

Restart backend after changes.

## 🆘 Help

**Backend won't start:**
```bash
cd backend
pip install -r requirements.txt
python run.py
```

**Google Calendar not working:**
- Check redirect URI in Google Cloud Console
- Make sure it's exactly: `http://localhost:8000/calendar/auth/callback`

**AI not scheduling:**
- Check OpenAI API key in `backend/.env`
- Check you have credits in your OpenAI account
- Look at `backend.log` for errors

**"No available slots" error:**
- Try "This Week" instead of "Today"
- Your fixed blocks might be consuming all time
- Reduce task durations

## 📚 More Info

- Full setup: [SETUP.md](./SETUP.md)
- Architecture: [README.md](./README.md)
- API docs: http://localhost:8000/docs (when running)

---

**Now go schedule your week and dominate! 🚀**
