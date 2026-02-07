# Device-Wide Data Storage Setup

## What Changed?

The platform now uses **device-wide file storage** instead of browser-specific LocalStorage. This means:

✅ **All browsers on the same device share the same data**
✅ **Data persists across browser sessions**
✅ **Data is stored in a JSON file on your device (not in cloud)**
✅ **Works with any browser (Chrome, Firefox, Edge, etc.)**

## How to Run

### Prerequisites
- **Node.js** must be installed on your computer
  - Download from: https://nodejs.org/
  - Install the LTS version

### Steps

1. **Open the project folder** in terminal/command prompt
   ```bash
   cd tensor-curiosity
   ```

2. **Run the start script**
   - **Windows**: Double-click `start.bat` or run it from command prompt
   - **Mac/Linux**: Run `node server.js` in terminal

3. **The server will start** and automatically open your browser at `http://localhost:8000`

4. **Use the platform** - All data is now stored in `data.json` file in the project folder

## How It Works

- **Server**: A local Node.js server runs on port 8000
- **Storage**: All data is saved in `data.json` file (created automatically)
- **Access**: Any browser on your device can access `http://localhost:8000` and see the same data
- **Sync**: Data syncs every 1.5 seconds across all open browser windows

## Important Notes

⚠️ **Keep the server running** - Close the server window only when you're done using the platform

⚠️ **Data Location** - Your data is stored in `data.json` in the project folder. Back up this file regularly!

⚠️ **Port 8000** - Make sure port 8000 is not used by another application

## Troubleshooting

**"Node.js is not installed"**
- Install Node.js from https://nodejs.org/
- Restart your computer after installation

**"Port 8000 already in use"**
- Close any other applications using port 8000
- Or modify `server.js` to use a different port (change `PORT = 8000`)

**"Cannot connect to server"**
- Make sure the server is running (check the server window)
- Try accessing `http://localhost:8000` directly in your browser

**Data not syncing between browsers**
- Make sure all browsers are accessing `http://localhost:8000`
- Don't use `file://` URLs - use the server URL

## Data Backup

To backup your data:
1. Copy the `data.json` file
2. Store it in a safe location
3. To restore, replace `data.json` with your backup

---

**Enjoy your device-wide synchronized Kirana Billing Platform!** 🎉
