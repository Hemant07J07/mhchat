#!/bin/bash

# MHChat - Quick Start Script for Linux/Mac

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          MHChat - AI Mental Health Support Chat              ║"
echo "║                   Quick Start Setup                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if in correct directory
if [ ! -f "manage.py" ]; then
    echo "Error: Please run this script from the project root directory"
    echo "Expected: $(pwd)"
    exit 1
fi

echo "[1/5] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "Error: Python3 is not installed"
    exit 1
fi
python3 --version
echo "✓ Python found"

echo ""
echo "[2/5] Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

echo ""
echo "[3/5] Installing Python dependencies..."
source venv/bin/activate
pip install -q -r requirements.txt
echo "✓ Dependencies installed"

echo ""
echo "[4/5] Running Django migrations..."
python manage.py migrate --quiet
echo "✓ Database migrations completed"

echo ""
echo "[5/5] Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install -q
    echo "✓ Frontend dependencies installed"
else
    echo "✓ Frontend dependencies already installed"
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_WS_HOST=ws
EOF
    echo "✓ Frontend environment configured"
fi

cd ..

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete!                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

echo "Next Steps:"
echo ""
echo "1. Start the Django backend (in Terminal 1):"
echo "   source venv/bin/activate"
echo "   python manage.py runserver"
echo "   Backend: http://localhost:8000"
echo ""
echo "2. Start the Next.js frontend (in Terminal 2):"
echo "   cd frontend"
echo "   npm run dev"
echo "   Frontend: http://localhost:3000"
echo ""
echo "3. Open your browser and navigate to:"
echo "   http://localhost:3000/login"
echo ""
echo "Demo Credentials:"
echo "   Email: demo@example.com"
echo "   Password: demo123456"
echo ""
echo "Documentation:"
echo "   - SETUP_GUIDE.md - Complete setup guide"
echo "   - FRONTEND_INTEGRATION_GUIDE.md - Frontend integration details"
echo ""
