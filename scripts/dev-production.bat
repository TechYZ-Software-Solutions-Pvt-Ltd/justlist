@echo off
echo 🚀 Starting JustList Production Environment...
echo.

REM Set environment
set ENV=production
set REACT_APP_ENV=production

REM Copy production environment config
copy configs\production.env .env

REM Start backend
echo 📡 Starting Backend Server...
start "Backend" cmd /k "python start_backend.py"

REM Wait for backend to start
timeout /t 5 /nobreak > nul

REM Start frontend
echo 🎨 Starting Frontend Server...
cd frontend
start "Frontend" cmd /k "npm start"
cd ..

echo.
echo ✅ Production environment started!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
pause
