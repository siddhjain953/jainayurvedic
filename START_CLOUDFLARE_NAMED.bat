@echo off
title Jain Ayurvedic Platform - Named Cloudflare Tunnel
color 0A

echo ========================================
echo   JAIN AYURVEDIC AGENCY PLATFORM
echo   Named Tunnel Mode
echo ========================================
echo.

:: Check if cloudflared is configured
if not exist "%USERPROFILE%\.cloudflared\config.yml" (
    echo ❌ ERROR: Named tunnel not configured yet!
    echo.
    echo Please follow setup guide first:
    echo 1. Run: cloudflared tunnel login
    echo 2. Run: cloudflared tunnel create jainayurvedic
    echo 3. Create config file in: %USERPROFILE%\.cloudflared\config.yml
    echo.
    echo See: exact_subdomain_setup.md for full instructions
    pause
    exit /b 1
)

:: Start Node.js server
echo [1/2] Starting Node.js server on port 8000...
start "Kirana Server" /MIN node server.js
timeout /t 3 /nobreak >nul
echo ✅ Server started

echo.
echo [2/2] Starting Named Cloudflare Tunnel...
echo ========================================
echo   Your Permanent URL:
echo   https://jainayurvedic.trycloudflare.com
echo.
echo   Customer: /customer.html
echo   Retailer: /retailer.html
echo ========================================
echo.

:: Start named tunnel
cloudflared tunnel run jainayurvedic

:: Cleanup when stopped
echo.
echo Tunnel stopped. Cleaning up...
taskkill /F /IM node.exe >nul 2>&1
pause
