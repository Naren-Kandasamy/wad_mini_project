@echo off
REM ==============================================================================
REM Shopping Cart System - Start Containers (Windows Batch)
REM Starts all 7 microservices in detached mode and displays running statuses.
REM ==============================================================================

cd /d "%~dp0"

IF NOT EXIST ".env" (
    echo [WARNING] .env file not found.
    echo Creating .env from .env.example template...
    copy .env.example .env
    echo Please populate your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
)

echo Starting Shopping Cart microservices stack...
docker compose up -d

echo.
echo Waiting for services to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ==================================================================
echo                 CONTAINER STATUS ^& ACTIVE PORTS                   
echo ==================================================================
docker compose ps

echo.
echo Service Endpoints:
echo    - Frontend UI:    http://localhost:80
echo    - API Gateway:    http://localhost:8080
echo    - Auth Status:    http://localhost:8080/api/me
echo    - User Service:   http://localhost:8081
echo    - Product Service:http://localhost:8082
echo    - Cart Service:   http://localhost:8083
echo    - Order Service:  http://localhost:8084
echo    - MongoDB:        localhost:27019
echo ==================================================================
echo All containers started successfully!
echo Run 'stop.bat' anytime to stop all containers and release ports.
echo ==================================================================
pause
