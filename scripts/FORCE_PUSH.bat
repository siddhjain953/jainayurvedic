@echo off
echo Pushing to Public Shop...
git push origin main
echo Pushing to Private Vault...
cd vault
git push origin main
cd ..
echo Done.
