@echo off
title Cloudflare Tunnel - Token Method
color 0A

echo ========================================
echo   CLOUDFLARE TUNNEL - TOKEN METHOD
echo ========================================
echo.

:: Check if token is provided
if "%1"=="" (
    echo ERROR: No token provided!
    echo.
    echo Usage:
    echo START_WITH_TOKEN.bat YOUR_TOKEN_HERE
    echo.
    echo Get your token from:
    echo https://one.dash.cloudflare.com/ ^> Zero Trust ^> Tunnels ^> Create Tunnel
    echo.
    pause
    exit /b 1
)

:: Start Node server
echo [1/2] Starting Node.js server...
start "Kirana Server" /MIN node server.js
timeout /t 3 /nobreak >nul
echo ✅ Server started on localhost:8000

echo.
echo [2/2] Starting Cloudflare Tunnel with token...
echo ========================================
echo   Your tunnel will appear below
echo ========================================
echo.

:: Start tunnel with token
cloudflared.exe tunnel run --token %1

:: Cleanup
taskkill /F /IM node.exe >nul 2>&1
pause
