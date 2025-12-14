@echo off
echo 🐳 Starting JustList Production with Docker...
echo.

REM Stop any existing containers
docker-compose -f docker-compose.production.yml down

REM Build and start production environment
docker-compose -f docker-compose.production.yml up --build

echo.
echo ✅ Production environment started with Docker!
echo 🌐 Frontend: http://localhost:80
echo 🔧 Backend: http://localhost:8000
echo.
pause
