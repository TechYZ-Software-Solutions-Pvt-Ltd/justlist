@echo off
echo 🐳 Starting JustList Demo with Docker...
echo.

REM Stop any existing containers
docker-compose -f docker-compose.demo.yml down

REM Build and start demo environment
docker-compose -f docker-compose.demo.yml up --build

echo.
echo ✅ Demo environment started with Docker!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8000
echo.
pause
