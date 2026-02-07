@echo off
cd /d "%~dp0.."
title START SHOP (Server + Tunnel) 🚀
color 0A

echo ===================================================
echo      STARTING YOUR INTELLIGENT SHOP...
echo ===================================================
echo.

:: 1. Cleanup Old Processes
echo [1/3] Cleaning up old processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1
if exist cloudflare\tunnel.log del cloudflare\tunnel.log
if exist server.log del server.log

:: 2. Start Server (Visible Window for Debugging)
echo [2/3] Starting Local Server...
echo      (Check server.log if this fails)
start "Kirana Server" cmd /k "node backend\server.js > server.log 2>&1"
timeout /t 5 /nobreak >nul

:: 3. Start Cloudflare Tunnel
echo [3/3] Connecting to Cloudflare...
start "Cloudflare Tunnel" /MIN cmd /c "npx -y cloudflared tunnel --url http://localhost:8000 > tunnel.log 2>&1"

:: 4. Sync Mechanism
echo.
echo [4/4] Waiting for Tunnel & Syncing Link...
echo      (Please wait 15 seconds...)

:loop
timeout /t 3 /nobreak >nul
node scripts\update_url.js --log cloudflare\tunnel.log
if %errorlevel% equ 0 goto success
goto loop

:success
echo.
echo ===================================================
echo      ✅ SHOP IS ONLINE & LINKED!
echo      - Retailer Config Synced to GitHub.
echo      - Customer Site Updated.
echo.
echo      You can now open: https://siddhjain953.github.io/jainayurvedic/
echo ===================================================
echo.
echo DO NOT CLOSE THIS WINDOW.
pause
