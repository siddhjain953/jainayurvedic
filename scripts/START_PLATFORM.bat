@echo off
title Jain Ayurvedic Agency - Platform Server
color 0A

echo ========================================
echo   JAIN AYURVEDIC AGENCY PLATFORM
echo   Starting Server + Cloudflare Tunnel
echo ========================================
echo.

:: Start Node.js server in background
echo [1/2] Starting Node.js server on port 8000...
start "Kirana Server" /MIN node server.js
timeout /t 3 /nobreak >nul
echo ✅ Server started

:: Check if cloudflared exists
where cloudflared >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Installing] Cloudflared not found, downloading...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
    echo ✅ Cloudflared installed
)

echo.
echo [2/2] Starting Cloudflare Tunnel...
echo ========================================
echo   IMPORTANT: Your public URL will appear below
echo   Share this URL with customers
echo ========================================
echo.

:: Start Cloudflare tunnel (shows URL in console)
cloudflared.exe tunnel --url http://localhost:8000

:: This part runs when tunnel is stopped
echo.
echo ========================================
echo   Tunnel stopped. Closing server...
echo ========================================
taskkill /F /IM node.exe >nul 2>&1
pause
