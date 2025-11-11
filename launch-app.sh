#!/bin/bash

# Accountability Centre - App Launcher
# This script is designed to be wrapped in a macOS app bundle

# Get the directory where this script lives
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Redirect output to log file
LOG_FILE="$SCRIPT_DIR/app.log"
exec > "$LOG_FILE" 2>&1

echo "=========================================="
echo "Starting Accountability Centre"
echo "Time: $(date)"
echo "=========================================="

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    osascript -e 'display alert "Configuration Missing" message "Please copy backend/.env.example to backend/.env and configure it." as critical'
    exit 1
fi

# Function to check if port is in use
check_port() {
    lsof -i:$1 > /dev/null 2>&1
    return $?
}

# Kill existing processes on our ports
if check_port 8000; then
    echo "Killing existing process on port 8000..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 2
fi

if check_port 5173; then
    echo "Killing existing process on port 5173..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Activate Python virtual environment
source backend/venv/bin/activate

# Start backend
echo "Starting backend server..."
cd backend
python run.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        osascript -e 'display alert "Backend Failed" message "Backend server failed to start. Check app.log for details." as critical'
        exit 1
    fi
done

# Start frontend
echo "Starting frontend server..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "Waiting for frontend to start..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "Frontend is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        osascript -e 'display alert "Frontend Failed" message "Frontend server failed to start. Check app.log for details." as critical'
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
done

# Save PIDs
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo "=========================================="
echo "Accountability Centre is running!"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "=========================================="

# Open browser
sleep 2
open http://localhost:5173

# Show success notification
osascript -e 'display notification "Accountability Centre is running at http://localhost:5173" with title "App Started Successfully"'

# Keep script running and monitor processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "Backend process died!"
        osascript -e 'display alert "Backend Crashed" message "The backend server has stopped unexpectedly." as critical'
        kill $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Frontend process died!"
        osascript -e 'display alert "Frontend Crashed" message "The frontend server has stopped unexpectedly." as critical'
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 5
done
