#!/bin/bash

echo "🔧 Setting up Accountability Centre..."
echo ""

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found!"
    echo ""
    echo "Please install Python 3.10+ first:"
    echo "  brew install python@3.11"
    echo ""
    echo "Or download from: https://www.python.org/downloads/"
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo ""
    echo "Please install Node.js 18+ first:"
    echo "  brew install node"
    echo ""
    echo "Or download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Setup backend
echo "📦 Setting up backend..."
cd backend

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating backend/.env from example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and add your API keys:"
    echo "   - OPENAI_API_KEY (get from: https://platform.openai.com/api-keys)"
    echo "   - GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET (get from: https://console.cloud.google.com/)"
    echo "   - SECRET_KEY (generate with: openssl rand -hex 32)"
    echo ""
fi

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate and install dependencies
echo "Installing backend dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

cd ..

# Setup frontend
echo ""
echo "📦 Setting up frontend..."

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env from example..."
    cp .env.example .env
fi

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Edit backend/.env with your API keys:"
echo "   nano backend/.env"
echo ""
echo "2. Get your API keys:"
echo "   • OpenAI: https://platform.openai.com/api-keys"
echo "   • Google OAuth: https://console.cloud.google.com/"
echo ""
echo "3. Start the system:"
echo "   ./start.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
