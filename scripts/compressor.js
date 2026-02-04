const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const IMAGES_DIR = path.join(__dirname, '../images/products');
const PROCESSED_DIR = path.join(__dirname, '../assets/products'); // GitHub friendly path
const MAX_WIDTH = 800;
const QUALITY = 80;

// Ensure directories exist
if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

console.log('📸 Starting Smart Image Compressor...');

// Note: In a production environment we would use 'sharp'. 
// Since we want to avoid complex npm installs for the user right now, 
// we will start by organizing the files. 
// A full compressor requires binary dependencies.
// For now, we will move and rename files to be web-ready.

// TODO: User needs to run 'npm install sharp' for real compression.
// We will check if we can run a simple copy/rename first for organization.

fs.readdir(IMAGES_DIR, (err, files) => {
    if (err) {
        console.log('⚠️ No input images folder found. Skipping compression.');
        return;
    }

    files.forEach(file => {
        if (file.match(/\.(jpg|jpeg|png)$/i)) {
            const srcPath = path.join(IMAGES_DIR, file);

            // Clean filename (lowercase, replace spaces with dashes)
            const ext = path.extname(file).toLowerCase();
            const basename = path.basename(file, ext).toLowerCase().replace(/[^a-z0-9]/g, '-');
            const newFilename = `${basename}${ext}`;
            const destPath = path.join(PROCESSED_DIR, newFilename);

            // Copy to assets folder
            // In Phase 2: Add sharp() compression here
            try {
                fs.copyFileSync(srcPath, destPath);
                console.log(`✅ Synced: ${file} -> assets/products/${newFilename}`);
            } catch (err) {
                console.error(`❌ Failed to sync ${file}:`, err.message);
            }
        }
    });
});

console.log('✨ Image organization complete.');
