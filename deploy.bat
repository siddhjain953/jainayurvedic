@echo off
echo ================================================
echo   COMPLETE DEPLOYMENT SCRIPT
echo   Data Sync + Cache-Busting + GitHub Push
echo ================================================
echo.

echo [1/4] Generating version and updating files...
node scripts\publish.js
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Publish script failed
    pause
    exit /b 1
)

echo.
echo [2/4] Staging all changes for Git...
git add .

echo.
echo [3/4] Committing changes...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" (
    git commit -m "Auto-deploy: Updated version and synced data"
) else (
    git commit -m "%commit_msg%"
)

echo.
echo [4/4] Pushing to GitHub...
git push origin main

echo.
echo ================================================
echo   DEPLOYMENT COMPLETE!
echo ================================================
echo.
echo Next Steps:
echo 1. Wait 1-2 minutes for GitHub Pages to rebuild
echo 2. Test Cloudflare URL in browser
echo 3. Verify data syncs across browsers
echo.
pause
