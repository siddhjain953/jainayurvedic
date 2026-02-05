const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * AUTO-UPDATE TUNNEL URL SYSTEM
 * Monitors tunnel log, detects URL changes, updates products.json, and pushes to GitHub
 */

const CONFIG_FILE = path.join(__dirname, '../api_config.json');
const PRODUCTS_FILE = path.join(__dirname, '../products.json');
const LOG_FILE = process.argv[2] || path.join(__dirname, '../tunnel.log');

console.log('🔄 Cloudflare Tunnel URL Auto-Update System');
console.log('━'.repeat(50));

// Function to extract URL from log
function extractTunnelUrl(logPath) {
    try {
        if (!fs.existsSync(logPath)) {
            console.log('⚠️  Log file not found:', logPath);
            return null;
        }

        const logContent = fs.readFileSync(logPath, 'utf8');
        const match = logContent.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);

        if (match) {
            return match[0];
        }
        return null;
    } catch (error) {
        console.error('❌ Error reading log:', error.message);
        return null;
    }
}

// Function to get current URL from config
function getCurrentUrl() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            return null;
        }
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        return config.tunnelUrl || config.apiUrl;
    } catch (error) {
        return null;
    }
}

// Function to update config file
function updateConfig(newUrl) {
    const config = {
        tunnelUrl: newUrl,
        lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('✅ Updated api_config.json');
}

// Function to update products.json with new backend URL
function updateProductsSnapshot(newUrl) {
    try {
        if (!fs.existsSync(PRODUCTS_FILE)) {
            console.log('⚠️  products.json not found. Run publish.js first.');
            return false;
        }

        const snapshot = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
        snapshot.backendAvailabilityHint = newUrl;

        if (snapshot.shop) {
            snapshot.shop.lastUpdated = new Date().toISOString();
        }

        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(snapshot, null, 2));
        console.log('✅ Updated products.json with new backend URL');
        return true;
    } catch (error) {
        console.error('❌ Error updating products.json:', error.message);
        return false;
    }
}

// Function to commit and push to GitHub
function pushToGitHub() {
    try {
        const repoPath = path.join(__dirname, '../');

        // Check if there are changes
        try {
            execSync('git diff --quiet products.json', { cwd: repoPath });
            console.log('ℹ️  No changes to push');
            return true;
        } catch (e) {
            // Changes detected, proceed with commit
        }

        console.log('📤 Pushing to GitHub...');
        execSync('git add products.json', { cwd: repoPath, stdio: 'inherit' });
        execSync(`git commit -m "🔄 Auto-update backend URL - ${new Date().toISOString()}"`, {
            cwd: repoPath,
            stdio: 'inherit'
        });
        execSync('git push origin main', { cwd: repoPath, stdio: 'inherit' });
        console.log('✅ Successfully pushed to GitHub');
        return true;
    } catch (error) {
        console.error('❌ Git push failed:', error.message);
        console.log('ℹ️  You may need to push manually');
        return false;
    }
}

// Main execution
function main() {
    console.log('🔍 Checking for tunnel URL...');

    const newUrl = extractTunnelUrl(LOG_FILE);
    if (!newUrl) {
        console.log('❌ No tunnel URL found in log file');
        console.log('ℹ️  Make sure Cloudflare tunnel is running');
        process.exit(1);
    }

    console.log('🌐 Found URL:', newUrl);

    const currentUrl = getCurrentUrl();

    if (currentUrl === newUrl) {
        console.log('ℹ️  URL unchanged, no update needed');
        process.exit(0);
    }

    if (currentUrl) {
        console.log('🔄 URL changed!');
        console.log('   Old:', currentUrl);
        console.log('   New:', newUrl);
    } else {
        console.log('🆕 First time setup');
    }

    // Update config file (local only, not pushed)
    updateConfig(newUrl);

    // Update products.json (this will be pushed to GitHub)
    if (!updateProductsSnapshot(newUrl)) {
        console.log('⚠️  Failed to update products.json');
        console.log('ℹ️  Run: node scripts/publish.js');
        process.exit(1);
    }

    // Push to GitHub
    console.log('');
    console.log('━'.repeat(50));
    pushToGitHub();

    console.log('');
    console.log('━'.repeat(50));
    console.log('✨ Update complete!');
    console.log('ℹ️  Customer platform will now use:', newUrl);
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { extractTunnelUrl, updateConfig, updateProductsSnapshot, pushToGitHub };
