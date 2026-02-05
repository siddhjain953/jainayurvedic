@echo off
echo ====================================
echo   GITHUB SYNC - CUSTOMER PLATFORM
echo ====================================
echo.

echo [1/3] Syncing data from retailer database...
node scripts\sync-to-github.js

echo.
echo [2/3] Adding files to git...
git add products.json customers.json shop.json index.html customer.html customer.js customer.css styles.css

echo.
echo [3/3] Committing and pushing to GitHub...
git commit -m "Sync: Customer data updated from retailer platform"
git push origin main

echo.
echo ====================================
echo   SYNC COMPLETE!
echo ====================================
echo Customer platform updated at:
echo https://siddhjain953.github.io/jainayurvedic/
echo.
pause
