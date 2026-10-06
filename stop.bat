@echo off
REM ==============================================================================
REM Shopping Cart System - Stop Containers (Windows Batch)
REM Stops and removes all project containers, freeing up all ports:
REM 80, 8080, 8081, 8082, 8083, 8084, 27019.
REM Note: Persistent database data stored in volume 'mongo-data' is preserved.
REM ==============================================================================

cd /d "%~dp0"

echo Stopping and shutting down Shopping Cart microservices...
docker compose down

echo.
echo ==================================================================
echo All project containers have been stopped and removed.
echo All ports (80, 8080, 8081, 8082, 8083, 8084, 27019) are now free!
echo Database records in volume 'mongo-data' remain safely preserved.
echo Run 'start.bat' whenever you want to restart the stack.
echo ==================================================================
pause
