const fs = require('fs');
const http = require('http');

console.log('--- Starting System Verification ---');

// 1. Verify Data & Credentials
try {
    const dataRaw = fs.readFileSync('data.json', 'utf8');
    const data = JSON.parse(dataRaw);

    console.log('[1/3] Data Integrity Check: PASS');

    const shopPhone = data.shop.phone || "";
    const adminPass = data.settings.adminPassword || "";

    console.log(`[Info] Shop Phone: ${shopPhone}`);
    console.log(`[Info] Admin Password: ${adminPass}`);

    // Simulate Login Logic (as extracted from retailer.js)
    const inputMobile = '9876543210';
    const inputPass = '87408';

    const registered10 = shopPhone.replace(/\D/g, '').slice(-10);
    const entered10 = inputMobile.replace(/\D/g, '').slice(-10);

    if (registered10 === entered10 && inputPass === adminPass) {
        console.log('[2/3] Login Logic Verification: PASS (Credentials match)');
    } else {
        console.error('[2/3] Login Logic Verification: FAIL');
        console.log(`Expected Last 10: ${registered10} / Pass: ${adminPass}`);
        console.log(`Input Last 10: ${entered10} / Pass: ${inputPass}`);
    }

} catch (e) {
    console.error('[1/3] Data Integrity Check: FAIL', e.message);
}

// 2. Verify Server Reachability
console.log('Pinging http://localhost:8000/retailer.html ...');
const req = http.get('http://localhost:8000/retailer.html', (res) => {
    console.log(`[3/3] Server Status Check: PASS (Status Code: ${res.statusCode})`);

    if (res.statusCode === 200) {
        console.log('--- Verification Complete: SYSTEM OPERATIONAL ---');
    } else {
        console.error('--- Verification Complete: SERVER WARNING (Non-200 Status) ---');
    }
});

req.on('error', (e) => {
    console.error(`[3/3] Server Status Check: FAIL (${e.message})`);
    console.error('--- Verification Complete: SYSTEM ISSUES DETECTED ---');
});
