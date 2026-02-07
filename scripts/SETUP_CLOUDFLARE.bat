@echo off
title Cloudflare Tunnel Setup Wizard
color 0B

echo ========================================
echo   CLOUDFLARE TUNNEL SETUP WIZARD
echo   Getting: jainayurvedic.trycloudflare.com
echo ========================================
echo.

:: Step 1: Check cloudflared
echo [Step 1/4] Checking cloudflared installation...
where cloudflared >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing cloudflared...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
    echo ✅ Installed cloudflared.exe
) else (
    echo ✅ cloudflared already installed
)

echo.
echo [Step 2/4] Login to Cloudflare...
echo.
echo IMPORTANT: A browser window will open.
echo Click "Authorize" when prompted.
echo.
pause

cloudflared tunnel login

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Login failed. Please try again.
    pause
    exit /b 1
)

echo ✅ Login successful

:: Step 3: Create tunnel
echo.
echo [Step 3/4] Creating named tunnel...
cloudflared tunnel create jainayurvedic

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ Tunnel creation might have failed.
    echo This is OK if tunnel already exists.
    echo.
)

:: Step 4: Create config
echo.
echo [Step 4/4] Creating configuration...

:: Get tunnel ID
for /f "tokens=*" %%i in ('cloudflared tunnel list ^| findstr "jainayurvedic"') do set TUNNEL_LINE=%%i

echo.
echo Creating config file...
echo tunnel: jainayurvedic > "%USERPROFILE%\.cloudflared\config.yml"
echo credentials-file: %USERPROFILE%\.cloudflared\[TUNNEL_ID].json >> "%USERPROFILE%\.cloudflared\config.yml"
echo. >> "%USERPROFILE%\.cloudflared\config.yml"
echo ingress: >> "%USERPROFILE%\.cloudflared\config.yml"
echo   - service: http://localhost:8000 >> "%USERPROFILE%\.cloudflared\config.yml"

echo.
echo ========================================
echo   ✅ SETUP COMPLETE!
echo ========================================
echo.
echo IMPORTANT: Edit this file manually:
echo %USERPROFILE%\.cloudflared\config.yml
echo.
echo Replace [TUNNEL_ID] with your actual tunnel ID
echo (Find it in: %USERPROFILE%\.cloudflared\ folder)
echo.
echo After fixing config, run:
echo START_CLOUDFLARE_NAMED.bat
echo.
echo Your URL will be:
echo https://jainayurvedic.trycloudflare.com
echo.
pause
