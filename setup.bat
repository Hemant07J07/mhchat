@echo off
REM MHChat - Quick Start Script for Windows

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║          MHChat - AI Mental Health Support Chat              ║
echo ║                   Quick Start Setup                           ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Check if in correct directory
if not exist "manage.py" (
    echo Error: Please run this script from the project root directory
    echo Expected: c:\Users\hdube\mhchat\
    pause
    exit /b 1
)

echo [1/5] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)
echo ✓ Python found

echo.
echo [2/5] Setting up Python virtual environment...
if not exist "venv" (
    python -m venv venv
    echo ✓ Virtual environment created
) else (
    echo ✓ Virtual environment already exists
)

echo.
echo [3/5] Installing Python dependencies...
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
echo ✓ Dependencies installed

echo.
echo [4/5] Running Django migrations...
python manage.py migrate --quiet
echo ✓ Database migrations completed

echo.
echo [5/5] Setting up frontend...
cd frontend
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install -q
    echo ✓ Frontend dependencies installed
) else (
    echo ✓ Frontend dependencies already installed
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo Creating .env.local...
    (
        echo NEXT_PUBLIC_API_BASE=http://localhost:8000
        echo NEXT_PUBLIC_WS_HOST=ws
    ) > .env.local
    echo ✓ Frontend environment configured
)

cd ..

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                    Setup Complete!                            ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo Next Steps:
echo.
echo 1. Start the Django backend (in Terminal 1):
echo    venv\Scripts\activate.bat
echo    python manage.py runserver
echo    Backend: http://localhost:8000
echo.
echo 2. Start the Next.js frontend (in Terminal 2):
echo    cd frontend
echo    npm run dev
echo    Frontend: http://localhost:3000
echo.
echo 3. Open your browser and navigate to:
echo    http://localhost:3000/login
echo.
echo Demo Credentials:
echo    Email: demo@example.com
echo    Password: demo123456
echo.
echo Documentation:
echo    - SETUP_GUIDE.md - Complete setup guide
echo    - FRONTEND_INTEGRATION_GUIDE.md - Frontend integration details
echo.

pause
