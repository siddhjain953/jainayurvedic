// ============================================
// KIRANA BILLING PLATFORM - LOCAL SERVER
// Device-wide data storage for all browsers
// ============================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');
const { spawn } = require('child_process');

const PORT = 8000;
const DATA_FILE = path.join(__dirname, 'data.json');
const DEVICES_FILE = path.join(__dirname, 'authorized_devices.json');
const ADMIN_PASSWORD = 'kirana2026'; // Default admin password - CHANGE THIS!

// CORS headers for cross-browser access (without Content-Type - set per response)
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

// Initialize data file if it doesn't exist
function initializeDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        const defaultData = {
            products: [],
            shop: {
                name: 'Sharma Kirana Store',
                address: '123 Main Street, Delhi - 110001',
                phone: '+91 98765 43210',
                email: 'sharma.kirana@example.com',
                gstin: '07AAAAA0000A1Z5',
                logo: ''
            },
            customers: {},
            bills: [],
            requests: [],
            offers: [],
            settings: {
                language: 'en',
                currency: '₹',
                pointsRatio: 100,
                pointsValue: 1,
                lowStockThreshold: 10,
                gstEnabled: true
            }
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    }

    // Initialize authorized devices file
    if (!fs.existsSync(DEVICES_FILE)) {
        const defaultDevices = {
            devices: [],
            maxDevices: 10 // Maximum number of authorized devices
        };
        fs.writeFileSync(DEVICES_FILE, JSON.stringify(defaultDevices, null, 2));
    }
}

// Read authorized devices
function readDevices() {
    try {
        const data = fs.readFileSync(DEVICES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { devices: [], maxDevices: 10 };
    }
}

// Write authorized devices
function writeDevices(devicesData) {
    try {
        fs.writeFileSync(DEVICES_FILE, JSON.stringify(devicesData, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing devices file:', error);
        return false;
    }
}

// Get device fingerprint from request
function getDeviceFingerprint(req) {
    // Use User-Agent + IP as device identifier
    const userAgent = req.headers['user-agent'] || '';
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
    // Create a simple hash-like identifier
    return Buffer.from(`${ip}-${userAgent}`).toString('base64').substring(0, 32);
}

// Check if device is authorized
// Check if device is authorized
function isDeviceAuthorized(req) {
    // DISABLE DEVICE CHECK FOR TUNNEL COMPATIBILITY
    // We now have strict Application-Level Login (Mobile + Password)
    // allowing "Go Live" tunnel requests from any IP.
    return true;
}

// Register new device
function registerDevice(req, deviceName, password) {
    if (password !== ADMIN_PASSWORD) {
        return { success: false, error: 'Invalid admin password' };
    }

    const devicesData = readDevices();

    // Check device limit
    if (devicesData.devices.length >= devicesData.maxDevices) {
        return { success: false, error: `Maximum ${devicesData.maxDevices} devices allowed` };
    }

    const deviceId = getDeviceFingerprint(req);

    // Check if already registered
    const existing = devicesData.devices.find(d => d.deviceId === deviceId);
    if (existing) {
        existing.authorized = true;
        existing.deviceName = deviceName;
        existing.lastAccess = new Date().toISOString();
    } else {
        devicesData.devices.push({
            deviceId: deviceId,
            deviceName: deviceName,
            authorized: true,
            registeredAt: new Date().toISOString(),
            lastAccess: new Date().toISOString()
        });
    }

    writeDevices(devicesData);
    return { success: true, deviceId: deviceId };
}

// Read data from file
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data file:', error);
        return null;
    }
}

// Write data to file
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data file:', error);
        return false;
    }
}

// Handle API requests
function handleAPIRequest(req, res, parsedUrl) {
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Handle OPTIONS (CORS preflight)
    if (method === 'OPTIONS') {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end();
        return;
    }

    let data = readData();
    if (!data) {
        res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read data' }));
        return;
    }

    // Parse request body for POST/PUT requests
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        let requestData = {};
        if (body) {
            try {
                requestData = JSON.parse(body);
            } catch (e) {
                // Ignore parse errors for empty body
            }
        }

        // Device Management API Routes (Public)
        if (pathname === '/api/device/register' && method === 'POST') {
            const { deviceName, password } = requestData;
            const result = registerDevice(req, deviceName || 'Unknown Device', password);
            res.writeHead(result.success ? 200 : 403, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
            return;
        }

        if (pathname === '/api/device/check' && method === 'GET') {
            const authorized = isDeviceAuthorized(req);
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ authorized }));
            return;
        }

        if (pathname === '/api/device/list' && method === 'GET') {
            // Check authorization first
            if (!isDeviceAuthorized(req)) {
                res.writeHead(403, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unauthorized' }));
                return;
            }
            const devicesData = readDevices();
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify(devicesData));
            return;
        }

        // Public APIs (no authorization needed)
        const isPublicAPI = pathname.startsWith('/api/device/');
        const isCustomerAPI = pathname === '/api/customers';

        // Customer-readable APIs (GET only - customers can read products/offers/shop info)
        const isCustomerReadAPI = (pathname === '/api/products' && method === 'GET') ||
            (pathname === '/api/offers' && method === 'GET') ||
            (pathname === '/api/shop' && method === 'GET');

        // Protect retailer APIs (write operations and admin features)
        if (!isCustomerAPI && !isPublicAPI && !isCustomerReadAPI && pathname.startsWith('/api/')) {
            // Check device authorization for retailer APIs
            if (!isDeviceAuthorized(req)) {
                res.writeHead(403, { ...corsHeaders, 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Device not authorized. Please register this device first.' }));
                return;
            }
        }

        // API Routes
        if (pathname === '/api/products' && method === 'GET') {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data.products || []));
        }
        else if (pathname === '/api/products' && method === 'POST') {
            const products = requestData.products || [];
            data.products = products;
            writeData(data);
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        }
        else if (pathname === '/api/shop' && method === 'GET') {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data.shop || {}));
        }
        else if (pathname === '/api/shop' && method === 'POST') {
            data.shop = requestData.shop || data.shop;
            writeData(data);
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        }
        else if (pathname === '/api/customers' && method === 'GET') {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data.customers || {}));
        }
        else if (pathname === '/api/customers' && method === 'POST') {
            data.customers = requestData.customers || data.customers;
            writeData(data);
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        }
        else if (pathname === '/api/bills' && method === 'GET') {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data.bills || []));
        }
        else if (pathname === '/api/bills' && method === 'POST') {
            data.bills = requestData.bills || data.bills;
            writeData(data);
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        }
        else if (pathname === '/api/requests' && method === 'GET') {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data.requests || []));
        }
        else if (pathname === '/api/requests' && method === 'POST') {
            data.requests = requestData.requests || data.requests;
            writeData(data);
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        }
        else if (pathname === '/api/offers' && method === 'GET') {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data.offers || []));
        }
        else if (pathname === '/api/offers' && method === 'POST') {
            data.offers = requestData.offers || data.offers;
            writeData(data);
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        }
        else if (pathname === '/api/settings' && method === 'GET') {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data.settings || {}));
        }
        else if (pathname === '/api/settings' && method === 'POST') {
            data.settings = requestData.settings || data.settings;
            writeData(data);
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        }
        else if (pathname === '/api/data' && method === 'GET') {
            // Get all data at once
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        }
        else if (pathname === '/api/data' && method === 'POST') {
            // Update all data at once
            data = { ...data, ...requestData };
            writeData(data);
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        }

        // ==========================================
        // TUNNELING API (STATUS ONLY - TUNNEL IS NOW PERMANENT)
        // ==========================================

        // New Logic: The tunnel starts automatically. This endpoint is just for the frontend to get the URL.
        else if (pathname === '/api/tunnel/status' && method === 'GET') {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                active: !!tunnelProcess,
                url: tunnelUrl,
                password: tunnelPassword // Send the cached IP/Password
            }));
        }

        // Legacy endpoints - just return current status
        else if (pathname === '/api/tunnel/start' || pathname === '/api/tunnel/stop') {
            res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                url: tunnelUrl,
                password: tunnelPassword,
                message: 'Tunnel is managed automatically by the server.'
            }));
        }

        else {
            res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }

    });
}


// ==========================================
// PERMANENT TUNNEL MANAGEMENT (Auto-Healing)
// Now supports both Cloudflare and localtunnel
// ==========================================

const FIXED_SUBDOMAIN = 'jain-ayurvedic-agency';
const USE_CLOUDFLARE = true; // ✅ Cloudflare enabled for permanent fixed URL
let tunnelProcess = null;
let tunnelUrl = null;
let tunnelPassword = null;

function startPermanentTunnel() {
    console.log('[Tunnel Manager] 🚀 Starting Permanent Tunnel...');

    if (USE_CLOUDFLARE) {
        // Cloudflare Tunnel (Professional, No IP verification)
        startCloudflareTunnel();
    } else {
        // localtunnel (Free, Has IP verification)
        startLocalTunnel();
    }
}

function startCloudflareTunnel() {
    console.log('[Tunnel Manager] Using Cloudflare Tunnel (Premium Mode)');

    // Check if cloudflared is installed
    const checkProcess = spawn('cloudflared', ['--version'], { shell: true });

    checkProcess.on('error', () => {
        console.error('[Tunnel Manager] ❌ cloudflared not found. Falling back to localtunnel...');
        startLocalTunnel();
        return;
    });

    checkProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('[Tunnel Manager] ❌ cloudflared not configured. Falling back to localtunnel...');
            startLocalTunnel();
            return;
        }

        // Start Cloudflare tunnel
        tunnelProcess = spawn('cloudflared', ['tunnel', 'run', 'jain-ayurvedic'], {
            shell: true,
            cwd: __dirname
        });

        tunnelProcess.stdout.on('data', (chunk) => {
            const text = chunk.toString();
            console.log('[Cloudflare Tunnel]', text);

            // Extract URL from Cloudflare output (if showing URL in logs)
            if (text.includes('https://')) {
                const match = text.match(/https:\/\/[^\s]+/);
                if (match) {
                    tunnelUrl = match[0];
                    console.log('[Tunnel Manager] 🟢 LIVE:', tunnelUrl);
                }
            }
        });

        tunnelProcess.stderr.on('data', (chunk) => {
            console.error('[Cloudflare Tunnel Error]', chunk.toString());
        });

        tunnelProcess.on('close', (code) => {
            console.log(`[Tunnel Manager] 🔴 Cloudflare Tunnel closed (Code: ${code}). Reconnecting in 5s...`);
            tunnelProcess = null;
            tunnelUrl = null;
            setTimeout(startPermanentTunnel, 5000);
        });

        // Cloudflare uses your domain, so set it directly
        tunnelUrl = 'https://shop.jainayurvedicagency.in'; // Update with your actual domain
        tunnelPassword = null; // No password needed for Cloudflare
    });
}

function startLocalTunnel() {
    console.log('[Tunnel Manager] Using localtunnel (Free Mode)');

    if (tunnelProcess) return; // Already running

    // Auto-fetch Public IP for Password just once
    if (!tunnelPassword) {
        https.get('https://api.ipify.org', (resp) => { // Changed from loca.lt/mytunnelpassword
            let data = '';
            resp.on('data', (chunk) => data += chunk);
            resp.on('end', () => {
                tunnelPassword = data.trim();
                console.log(`[Tunnel Manager] 🔑 Access Password (Public IP): ${tunnelPassword}`);
            });
        }).on('error', (err) => console.error("[Tunnel Manager] ⚠️ Could not fetch IP:", err.message));
    }

    // Spawn Tunnel with fixed subdomain and proper configuration
    tunnelProcess = spawn('npx', ['-y', 'localtunnel', '--port', PORT, '--subdomain', FIXED_SUBDOMAIN, '--local-host', '127.0.0.1'], { shell: true });

    tunnelProcess.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        // console.log('[Tunnel]:', text); 
        const match = text.match(/your url is: (https?:\/\/[^\s]+)/i);
        if (match && match[1]) {
            tunnelUrl = match[1];
            console.log(`[Tunnel Manager] 🟢 LIVE: ${tunnelUrl}`);
        }
    });

    tunnelProcess.stderr.on('data', (chunk) => {
        // console.error('[Tunnel Error]:', chunk.toString());
    });

    tunnelProcess.on('close', (code) => {
        console.log(`[Tunnel Manager] 🔴 Tunnel crashed/closed (Code: ${code}). Reconnecting in 3s...`);
        tunnelProcess = null;
        tunnelUrl = null;
        // AUTO-HEALING: Restart after 3 seconds
        setTimeout(startPermanentTunnel, 3000);
    });
}
// Start tunnel immediately on server launch
// setTimeout(startPermanentTunnel, 1000); // DISABLED: We use START_TODAY.bat for external tunnel management

// Create server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Serve static files
    if (parsedUrl.pathname.startsWith('/api/')) {
        handleAPIRequest(req, res, parsedUrl);
    } else {
        // Protect retailer.html - require device authorization
        if (parsedUrl.pathname === '/retailer.html' || parsedUrl.pathname === '/retailer-login.html') {
            // Allow retailer-login.html without auth, but protect retailer.html
            if (parsedUrl.pathname === '/retailer.html' && !isDeviceAuthorized(req)) {
                // Redirect to login page
                res.writeHead(302, {
                    'Location': '/retailer-login.html',
                    ...corsHeaders
                });
                res.end();
                return;
            }
        }

        // Serve HTML/CSS/JS files
        // ✅ RE-ROUTING LOGIC
        // Tunnel Root (/) -> Retailer Login (For Shop Owner)
        // GitHub Root -> index.html (Already set for Customer)
        let requestPath = parsedUrl.pathname;
        if (requestPath === '/') {
            requestPath = '/retailer-login.html';
        }

        let filePath = path.join(__dirname, requestPath);

        // Security: prevent directory traversal
        if (!filePath.startsWith(__dirname)) {
            res.writeHead(403, { ...corsHeaders, 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };

        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { ...corsHeaders, 'Content-Type': 'text/plain' });
                    res.end('File not found');
                } else {
                    res.writeHead(500, { ...corsHeaders, 'Content-Type': 'text/plain' });
                    res.end('Server error');
                }
            } else {
                const contentType = contentTypes[ext] || 'application/octet-stream';

                // Production-ready caching strategy
                const cacheControl = ext === '.html' ? 'no-cache' : 'public, max-age=31536000';

                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Cache-Control': cacheControl,
                    'bypass-tunnel-reminder': 'true', // Permanent tunnel fix
                    ...corsHeaders
                });
                res.end(content);
            }
        });
    }
});

// Initialize and start server
initializeDataFile();

server.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`Kirana Billing Platform Server`);
    console.log(`========================================`);
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log(`Data storage: ${DATA_FILE}`);
    console.log(`\nOpen your browser and go to:`);
    console.log(`http://localhost:${PORT}`);
    console.log(`\nPress Ctrl+C to stop the server\n`);
});
