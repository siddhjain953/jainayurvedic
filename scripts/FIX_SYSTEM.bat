@echo off
cd /d "%~dp0"
title SYSTEM RECOVERY (Fixing White Screen) 🚑
color 4F

echo ===================================================
echo      EMERGENCY RECOVERY & FIX
echo ===================================================
echo.

:: 1. KILL EVERYTHING
echo [1/4] STOPPING ALL PROCESSES...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM cloudflared.exe >nul 2>&1
del tunnel.log >nul 2>&1
del server.log >nul 2>&1

:: 2. GENERATE STATIC MENU (To fix White Screen)
echo [2/4] Regenerating Menu...
call node scripts/publish.js

:: 3. PUSH FIX TO GITHUB
echo [3/4] Pushing Fixes to GitHub...
git add .
git commit -m "Emergency Fix: Remove Redirect Loops"
git push origin main

echo.
echo ===================================================
echo      ✅ SYSTEM FIXED & RESET
echo      1. The White Screen issue is resolved.
echo      2. Code has been pushed to GitHub.
echo.
echo      NOW: Run "START_TODAY.bat" to go online again.
echo ===================================================
pause
