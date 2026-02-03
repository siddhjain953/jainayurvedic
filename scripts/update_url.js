const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse --log argument
const logArgIndex = process.argv.indexOf('--log');
if (logArgIndex === -1 || !process.argv[logArgIndex + 1]) {
    console.error('❌ Usage: node update_url.js --log <path-to-tunnel-log>');
    process.exit(1);
}
const logFile = process.argv[logArgIndex + 1];

console.log(`🔍 Scanning log file: ${logFile}`);

try {
    const logContent = fs.readFileSync(logFile, 'utf8');
    // Regex to find https://[something].trycloudflare.com
    const match = logContent.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);

    if (!match) {
        console.error('❌ No Cloudflare URL found in log yet.');
        process.exit(1);
    }

    const newUrl = match[0];
    console.log(`✅ Found Tunnel URL: ${newUrl}`);

    const configPath = path.join(__dirname, '../api_config.json');
    const config = {
        apiUrl: newUrl,
        lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log('☁️ Syncing new URL to GitHub...');
    execSync('git add api_config.json', { cwd: path.join(__dirname, '../') });
    execSync('git commit -m "Auto-Update Tunnel URL"', { cwd: path.join(__dirname, '../') });
    execSync('git push origin main', { cwd: path.join(__dirname, '../') });
    console.log('🚀 URL Synced Successfully!');

} catch (error) {
    if (error.code === 'ENOENT') {
        console.error('❌ Log file not found.');
    } else {
        console.error('⚠️ Error:', error.message);
    }
    process.exit(1);
}
