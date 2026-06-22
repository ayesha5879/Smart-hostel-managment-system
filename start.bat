@echo off
echo ===================================================
echo 🏨 AEGIS HOSTEL MANAGEMENT PLATFORM SETUP & LAUNCH
echo ===================================================
echo.

:: Check for backend env configuration
if not exist "backend\.env" (
    echo [1/4] Configuring environment variables...
    copy "backend\.env.example" "backend\.env"
) else (
    echo [1/4] Environment configuration detected.
)

:: Install backend dependencies & setup database
echo.
echo [2/4] Initializing Backend Service & Prisma Ledger...
cd backend
call npm install --no-audit --no-fund --legacy-peer-deps
call npx prisma generate
echo.
echo Running PostgreSQL Migrations...
call npx prisma migrate dev --name init
echo.
echo Seeding mock dataset (100 students, 50 rooms, 10 staff)...
call npm run prisma:seed
cd ..

:: Install frontend dependencies
echo.
echo [3/4] Initializing Frontend React App...
cd frontend
call npm install --no-audit --no-fund --legacy-peer-deps
cd ..

:: Launch servers in parallel windows
echo.
echo [4/4] Starting parallel developer servers...
echo.
echo ===================================================
echo 🚀 Launching Aegis API Server (Port 5000)...
echo 🚀 Launching Aegis React Web App (Port 3000)...
echo ===================================================
echo.

start cmd /k "cd backend && title Aegis Backend API && npm run dev"
start cmd /k "cd frontend && title Aegis React Frontend && npm run dev"

echo Complete! Keep the two launched terminal windows active to keep the platform running.
echo Access the web portal at: http://localhost:3000
pause
