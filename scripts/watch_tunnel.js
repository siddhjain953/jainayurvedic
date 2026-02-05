const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * TUNNEL URL WATCHER
 * Monitors tunnel log file for URL changes and triggers auto-update
 */

const LOG_FILE = process.argv[2] || path.join(__dirname, '../tunnel.log');
const CHECK_INTERVAL = 10000; // Check every 10 seconds

console.log('👁️  Cloudflare Tunnel URL Watcher Started');
console.log('━'.repeat(50));
console.log('📁 Monitoring:', LOG_FILE);
console.log('⏱️  Check interval: 10 seconds');
console.log('');

let lastUrl = null;
let lastModified = null;

function checkForUpdates() {
    try {
        // Check if log file exists
        if (!fs.existsSync(LOG_FILE)) {
            return;
        }

        // Check if file was modified
        const stats = fs.statSync(LOG_FILE);
        if (lastModified && stats.mtime.getTime() === lastModified) {
            return; // No changes
        }
        lastModified = stats.mtime.getTime();

        // Read log and extract URL
        const logContent = fs.readFileSync(LOG_FILE, 'utf8');
        const match = logContent.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);

        if (!match) {
            return;
        }

        const currentUrl = match[0];

        // Check if URL changed
        if (currentUrl !== lastUrl) {
            if (lastUrl) {
                console.log('🔄 URL CHANGED!');
                console.log('   Old:', lastUrl);
                console.log('   New:', currentUrl);
            } else {
                console.log('🆕 URL DETECTED:', currentUrl);
            }

            lastUrl = currentUrl;

            // Trigger update script
            console.log('🚀 Triggering auto-update...');
            const updateScript = path.join(__dirname, 'update_url.js');
            const child = spawn('node', [updateScript, LOG_FILE], {
                cwd: path.join(__dirname, '../'),
                stdio: 'inherit'
            });

            child.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Update completed successfully');
                } else {
                    console.log('⚠️  Update completed with warnings');
                }
                console.log('');
            });
        }
    } catch (error) {
        // Silently ignore errors (file might not exist yet)
    }
}

// Initial check
checkForUpdates();

// Set up interval
setInterval(checkForUpdates, CHECK_INTERVAL);

console.log('✅ Watcher active. Press Ctrl+C to stop.');
console.log('');
