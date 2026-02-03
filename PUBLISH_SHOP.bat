@echo off
title Publish Shop to Cloud ☁️
color 0B

echo ===================================================
echo      PUBLISHING YOUR SHOP TO GITHUB CLOUD
echo ===================================================
echo.

:: 1. Compress Images
echo [1/4] Optimizing Images...
node scripts/compressor.js

:: 2. Encrypt Database (Safety First)
echo [2/4] Encrypting Private Data...
node scripts/encryptor.js

:: 3. Generate Static Menu
echo [3/4] Updating Cloud Menu...
:: We will add a simple script to extract public products later
:: For now, we assume products.json is ready if needed

:: 4. Upload to GitHub
echo [4/5] Uploading Shop to Public Cloud...
:: ONLY public files
git add .
git commit -m "Shop Update: %date% %time%"
git push origin main --force

echo [5/5] Backing up Encrypted Data to Private Vault...
:: Note: We use a separate push for the private repo if possible
:: For now, we push everything (since gitignore protects data.json) to the vault too
git push vault main --force

echo.
echo ===================================================
echo      ✅ SHOP UPDATE COMPLETE
echo      Website: https://siddhjain953.github.io/jainayurvedic/
echo ===================================================
pause
