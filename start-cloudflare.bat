@echo off
echo ========================================
echo   CLOUDFLARE TUNNEL QUICK SETUP
echo   (FREE - No Registration Needed)
echo ========================================
echo.

:: Check if cloudflared exists
where cloudflared >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [1/2] Installing cloudflared...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
    echo ✅ Installed cloudflared.exe
) else (
    echo ✅ cloudflared already installed
)

echo.
echo [2/2] Starting Cloudflare Tunnel...
echo.
echo ========================================
echo   YOUR FREE PERMANENT URL WILL APPEAR BELOW
echo ========================================
echo.

:: Start tunnel (will show URL in output)
cloudflared.exe tunnel --url http://localhost:8000

pause
