# Troubleshooting Guide

## 🔍 Frontend Loads But Shows Nothing

### Quick Diagnosis

1. **Open browser console** (Right-click → Inspect → Console tab)
2. Look for errors (red text)

Common issues and fixes:

---

## ❌ Issue: "Failed to fetch" or Network Error

**Problem**: Frontend can't reach backend

**Fix**:
```bash
# Check if backend is running
curl http://localhost:8000/health

# If it fails, restart backend
cd backend
source venv/bin/activate
python run.py
```

---

## ❌ Issue: Module not found / Import errors

**Problem**: Missing dependencies

**Fix**:
```bash
# Reinstall frontend dependencies
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## ❌ Issue: Blank page with no errors

**Problem**: React Router or component issue

**Fix**: Check the route

1. Go to: http://localhost:5173/
2. You should see Dashboard (this works with existing IndexedDB)
3. Try: http://localhost:5173/tasks
4. Try: http://localhost:5173/calendar

If `/calendar` is blank but others work, it's a calendar component issue.

---

## ❌ Issue: Calendar page shows errors

**Problem**: Backend not configured or not running

**Steps**:

1. **Verify backend is running**:
   ```bash
   curl http://localhost:8000/health
   ```

   Should return:
   ```json
   {
     "status": "healthy",
     "version": "1.0.0",
     "google_calendar_connected": false,
     "openai_available": true,
     "database_healthy": true
   }
   ```

2. **Check backend logs**:
   ```bash
   tail -f backend.log
   ```

   Look for errors.

3. **Check backend .env**:
   ```bash
   cat backend/.env
   ```

   Make sure `OPENAI_API_KEY` is set (not the example value).

---

## 🔧 Complete Reset

If nothing works, do a complete reset:

```bash
# Stop everything
./stop.sh

# Kill any remaining processes
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Clean frontend
rm -rf node_modules package-lock.json
npm install

# Clean backend
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Start fresh
./start.sh
```

---

## 🧪 Test Individual Components

### Test Backend Only

```bash
cd backend
source venv/bin/activate
python run.py
```

Then visit: http://localhost:8000/docs

You should see the interactive API documentation.

### Test Frontend Only

```bash
npm run dev
```

Visit: http://localhost:5173

Try the existing pages (Dashboard, Tasks, Habits, Clients).

---

## 📝 Most Common Issue: Missing Environment Variables

### Backend `.env` must have:

```env
OPENAI_API_KEY=sk-your-actual-key  # NOT the example
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
SECRET_KEY=some-long-random-string
```

If any of these are missing or still have example values, the backend won't work properly.

### Frontend `.env` must have:

```env
VITE_API_URL=http://localhost:8000
```

---

## 🐛 Check Browser Console Errors

Common errors and meanings:

| Error | Meaning | Fix |
|-------|---------|-----|
| `Failed to fetch` | Backend not running | Start backend: `cd backend && python run.py` |
| `Module not found` | Missing dependency | Run `npm install` |
| `Unexpected token` | Build error | Clear cache: `rm -rf node_modules && npm install` |
| `Cannot read property` | Data not loaded | Check IndexedDB in browser DevTools |
| `CORS error` | Backend CORS issue | Check `CORS_ORIGINS` in backend/.env |

---

## 📊 Verify Data

The existing system (Tasks, Habits, Clients) uses IndexedDB.

**Check if data exists**:
1. Open browser DevTools (F12)
2. Go to "Application" tab
3. Click "IndexedDB" in left sidebar
4. Look for "AccountabilityCentre" database
5. Check if tables have data

If no data, that's fine - just means first run.

---

## 🆘 Still Not Working?

Run this diagnostic script:

```bash
#!/bin/bash
echo "=== System Check ==="
echo "Node version: $(node --version)"
echo "Python version: $(python3 --version)"
echo "npm version: $(npm --version)"
echo ""
echo "=== Port Check ==="
lsof -i:8000 && echo "✅ Backend running on 8000" || echo "❌ Port 8000 free"
lsof -i:5173 && echo "✅ Frontend running on 5173" || echo "❌ Port 5173 free"
echo ""
echo "=== Backend Health ==="
curl -s http://localhost:8000/health | jq . 2>/dev/null || echo "❌ Backend not responding"
echo ""
echo "=== Frontend Check ==="
curl -s http://localhost:5173 | head -n 5
```

Save as `diagnostic.sh`, run `chmod +x diagnostic.sh && ./diagnostic.sh`

---

## 💡 Quick Fixes

### Backend won't start
```bash
cd backend
source venv/bin/activate
pip install --upgrade -r requirements.txt
python run.py
```

### Frontend won't build
```bash
rm -rf node_modules .vite
npm install
npm run dev
```

### Database errors
```bash
cd backend
rm accountability.db  # Deletes DB, will recreate
python run.py
```

### CORS errors
Edit `backend/.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173
```

---

## 📞 What to Check Right Now

Since your frontend is blank:

1. **Open browser console** (Right-click page → Inspect → Console)
2. **Look for red errors**
3. **Tell me what you see**

Common things you might see:
- ❌ "Failed to fetch" → Backend not running
- ❌ "Module not found" → Missing dependency
- ❌ Red text about imports → Build issue
- ✅ No errors → Calendar page might need backend to be fully configured

Also check:
- Does http://localhost:5173/tasks work? (Should show your existing tasks page)
- Does http://localhost:5173/ work? (Should show Dashboard)
