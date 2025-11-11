#!/bin/bash

# Accountability Centre - Startup Script
# Starts both frontend and backend servers

echo "🚀 Starting Accountability Centre with AI Scheduling..."
echo ""

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env not found!"
    echo "   Please copy backend/.env.example to backend/.env and configure it."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env not found, creating from example..."
    cp .env.example .env
fi

# Function to check if port is in use
check_port() {
    lsof -i:$1 > /dev/null 2>&1
    return $?
}

# Check if backend is already running
if check_port 8000; then
    echo "⚠️  Port 8000 already in use. Backend might already be running."
    echo "   Kill existing process? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        lsof -ti:8000 | xargs kill -9
        echo "✅ Killed existing process on port 8000"
    fi
fi

# Check if frontend is already running
if check_port 5173; then
    echo "⚠️  Port 5173 already in use. Frontend might already be running."
    echo "   Kill existing process? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        lsof -ti:5173 | xargs kill -9
        echo "✅ Killed existing process on port 5173"
    fi
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Install backend dependencies
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
else
    cd backend
    source venv/bin/activate
    cd ..
fi

echo ""
echo "🔥 Starting servers..."
echo ""

# Start backend in background
echo "Starting backend on http://localhost:8000..."
cd backend
python run.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 1
done

# Start frontend in background
echo "Starting frontend on http://localhost:5173..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "Waiting for frontend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    sleep 1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Accountability Centre is running!"
echo ""
echo "📱 Frontend:  http://localhost:5173"
echo "🔧 Backend:   http://localhost:8000"
echo "📚 API Docs:  http://localhost:8000/docs"
echo ""
echo "📝 Logs:"
echo "   Frontend: tail -f frontend.log"
echo "   Backend:  tail -f backend.log"
echo ""
echo "🛑 To stop: Press Ctrl+C or run: ./stop.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Open browser (optional)
if command -v open > /dev/null 2>&1; then
    sleep 2
    open http://localhost:5173
elif command -v xdg-open > /dev/null 2>&1; then
    sleep 2
    xdg-open http://localhost:5173
fi

# Save PIDs to file for stop script
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# Wait for user to stop
wait
