@echo off
echo ========================================
echo Kirana Billing Platform - Starting...
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if server.js exists
if not exist "server.js" (
    echo ERROR: server.js not found!
    echo Please make sure you're in the correct directory.
    pause
    exit /b 1
)

REM Start the server
echo Starting local server...
echo.
start "Kirana Server" cmd /k "node server.js"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Open browser
echo Opening browser...
start "" "http://localhost:8000"

echo.
echo ========================================
echo Server is running at http://localhost:8000
echo Close this window to stop the server
echo ========================================
echo.
