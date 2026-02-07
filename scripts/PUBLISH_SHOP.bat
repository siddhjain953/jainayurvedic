@echo off
cd /d "%~dp0"
title PUBLISH SHOP (Sync & Backup) 🔄
color 0B

echo ===================================================
echo      EVENING ROUTINE: SYNCING SHOP TO CLOUD
echo ===================================================
echo.

:: 1. Compress Images
echo [1/4] Optimizing & Compressing Images...
call node scripts/compressor.js

:: 2. Encrypt Database
echo [2/4] Encrypting Private Data...
call node scripts/encryptor.js

:: 3. Generate Static Menu
echo [3/4] Updating Static Menu...
call node scripts/publish.js

:: 4. Push Public Shop
echo [4/5] Uploading Public Shop...
git add .
git commit -m "Shop Sync: %date% %time%"
git push origin main

:: 5. Push Private Vault
echo [5/5] Uploading Private Vault...
cd vault
git add .
git commit -m "Vault Backup: %date% %time%"
git push origin main
cd ..

echo.
echo ===================================================
echo      ✅ SYNC COMPLETE!
echo      You can now close your laptop.
echo ===================================================
pause
