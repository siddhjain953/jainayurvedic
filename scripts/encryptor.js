const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Configuration
const DATA_FILE = path.join(__dirname, '../data.json');
const ENCRYPTED_FILE = path.join(__dirname, '../data.enc');
const SECRET_KEY_FILE = path.join(__dirname, '../secret.key');

// Generate or Load Key
let key;
if (fs.existsSync(SECRET_KEY_FILE)) {
    key = fs.readFileSync(SECRET_KEY_FILE);
} else {
    console.log('🔐 Generating new Encryption Key...');
    key = crypto.randomBytes(32); // 256 bits
    fs.writeFileSync(SECRET_KEY_FILE, key);
}

const IV_LENGTH = 16; // Reset IV for each encryption

function encryptData() {
    if (!fs.existsSync(DATA_FILE)) {
        console.log('⚠️ No data.json found to encrypt.');
        return;
    }

    const data = fs.readFileSync(DATA_FILE);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Store IV + Encrypted Data
    const result = Buffer.concat([iv, encrypted]);

    fs.writeFileSync(ENCRYPTED_FILE, result);
    console.log(`🔒 Data Encrypted Successfully: ${ENCRYPTED_FILE}`);
}

encryptData();
