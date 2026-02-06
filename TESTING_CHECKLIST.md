# Testing Checklist

## What Was Fixed

✅ **Centralized Data Storage**
- Server now uses `kirana_data.json` (single source of truth)
- All browsers connect to same data file

✅ **Version System**
- `version.json` tracks deployment version
- Auto-generated on every publish

✅ **Cache-Busting**
- All CSS/JS files have `?v=VERSION` parameter
- Browser must reload files when version changes

✅ **Auto Cache Clearing**
- dataManager.js checks version on startup
- Clears old cache when new version detected

✅ **Automated Deployment**
- `DEPLOY.bat` handles entire process
- `scripts/publish.js` auto-updates HTML files

## Testing Steps

### Test 1: Localhost Consistency

1. Close all browser windows
2. Run `START_COMPLETE.bat`
3. Open `http://localhost:8000/retailer.html` in Chrome
4. Note the version in console: `localStorage.getItem('app_version')`
5. Open same URL in Edge
6. Verify same version appears
7. Check Dashboard and Customer tabs in both browsers
8. **Expected:** Identical UI and data

### Test 2: Cross-Account Consistency

1. Open retailer.html in Chrome (logged into Google Account 1)
2. Open retailer.html in Chrome Incognito (logged into Google Account 2)
3. Add a product in Account 1
4. Refresh Account 2
5. **Expected:** Product appears in Account 2

### Test 3: Cloudflare Deployment

1. Run `DEPLOY.bat`
2. Wait 2 minutes for GitHub Pages rebuild
3. Open Cloudflare URL in browser
4. Check version in console
5. **Expected:** Same version as localhost

### Test 4: Version Update

1. Run `node scripts\publish.js`
2. Note the new version number
3. Refresh browser
4. Check console for "New version detected, clearing cache..." message
5. **Expected:** Cache automatically cleared

## Success Criteria

✅ All browsers show same data
✅ All Google accounts show same data
✅ Localhost and Cloudflare show same UI
✅ Version system working
✅ Cache auto-clears on update

## If Issues Occur

**Dashboard still showing error:**
- Check browser console for actual error message
- Run `DEPLOY.bat` to ensure latest version

**Data not syncing:**
- Verify server is running (`START_COMPLETE.bat`)
- Check that `kirana_data.json` exists
- Verify API base in console: `dataManager.apiBase`

**Cloudflare showing old version:**
- Wait 5 minutes for GitHub Pages
- Clear browser cache manually (Ctrl+Shift+Delete)
- Check GitHub Pages deployment status
