@echo off
echo ========================================
echo   SYNC TO GITHUB (CLOUD BACKUP)
echo ========================================
echo.

:: Add all files
git add .

:: Commit with timestamp
git commit -m "Auto-Sync: %date% %time%"

:: Push to main branch
git push origin main

echo.
echo ========================================
echo   SYNC COMPLETE
echo ========================================
timeout /t 5
