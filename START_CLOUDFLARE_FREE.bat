@echo off
title Jain Ayurvedic Platform - Cloudflare Anonymous Tunnel
color 0A

echo ========================================
echo   JAIN AYURVEDIC AGENCY PLATFORM
echo   Cloudflare Free Tunnel
echo ========================================
echo.

:: Start Node.js server in background
echo [1/2] Starting Node.js server on port 8000...
start "Kirana Server" /MIN node server.js
timeout /t 3 /nobreak >nul
echo ✅ Server started

echo.
echo [2/2] Starting Cloudflare Tunnel...
echo ========================================
echo   Your permanent URL will appear below
echo   Customer: [URL]/customer.html
echo   Retailer: [URL]/retailer.html
echo ========================================
echo.

:: Start anonymous tunnel
.\cloudflared.exe tunnel --url http://localhost:8000

:: Cleanup when tunnel stops
echo.
echo Tunnel stopped. Cleaning up...
taskkill /F /IM node.exe >nul 2>&1
pause
