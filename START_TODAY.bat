@echo off
title Get Today's Shop Link - Kirana Platform
color 0E

echo ===================================================
echo      GETTING YOUR SHOP LINK FOR TODAY...
echo ===================================================
echo.

:: 1. Cleanup old processes to prevent conflicts
echo [1/3] Cleaning up old connections...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1

:: 2. Start Server
echo [2/3] Starting Shop Server...
start "Kirana Server" /MIN node server.js
timeout /t 3 /nobreak >nul
echo ✅ Server Active

:: 3. Start Tunnel (This generates the link)
echo [3/3] Generating New Link...
echo.
echo ===================================================
echo   LOOK BELOW FOR A LINK ENDING IN .trycloudflare.com
echo   Example: https://happy-dog-123.trycloudflare.com
echo ===================================================
echo.
echo   YOUR CUSTOMER LINK IS THE ROOT URL:
echo   Accepts: https://[your-link].trycloudflare.com
echo.
echo   See your link below...
echo ===================================================
echo.

:: Run tunnel
cloudflared.exe tunnel --url http://localhost:8000

:: Pause if it crashes
pause
