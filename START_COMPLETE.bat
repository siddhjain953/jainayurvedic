@echo off
REM ============================================
REM COMPLETE STARTUP SCRIPT
REM Starts Cloudflare Tunnel + Backend + URL Watcher
REM ============================================

echo.
echo ========================================
echo   KIRANA PLATFORM - COMPLETE STARTUP
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

REM Check if cloudflared is installed
where cloudflared >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] cloudflared not found! Please install Cloudflare Tunnel first.
    pause
    exit /b 1
)

echo [1/4] Starting Cloudflare Tunnel...
echo.

REM Start Cloudflare tunnel in background, redirect output to log
start "Cloudflare Tunnel" /MIN cmd /c "cloudflared tunnel --url http://localhost:8000 > tunnel.log 2>&1"

REM Wait for tunnel to initialize
echo Waiting for tunnel to initialize (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo [2/4] Starting Backend Server...
echo.

REM Start backend server in background
start "Backend Server" /MIN cmd /c "node server.js"

REM Wait for server to start
echo Waiting for server to start (3 seconds)...
timeout /t 3 /nobreak >nul

echo.
echo [3/4] Detecting Tunnel URL...
echo.

REM Run URL update script
node scripts\update_url.js tunnel.log

if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Could not auto-update URL. You may need to run manually.
) else (
    echo [SUCCESS] URL updated successfully!
)

echo.
echo [4/4] Starting URL Watcher...
echo.

REM Start URL watcher in background
start "URL Watcher" /MIN cmd /c "node scripts\watch_tunnel.js tunnel.log"

echo.
echo ========================================
echo   ALL SERVICES STARTED!
echo ========================================
echo.
echo Running Services:
echo   - Cloudflare Tunnel (background)
echo   - Backend Server (Port 8000)
echo   - URL Watcher (monitoring changes)
echo.
echo To view tunnel URL, check: api_config.json
echo To stop all services, close this window or press Ctrl+C
echo.
echo Opening Retailer Platform...
echo.

REM Open retailer platform in default browser
start "" "retailer.html"

echo.
echo Press any key to stop all services...
pause >nul

REM Cleanup: Kill all background processes
taskkill /FI "WINDOWTITLE eq Cloudflare Tunnel" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Backend Server" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq URL Watcher" /F >nul 2>&1

echo.
echo All services stopped.
echo.
pause
