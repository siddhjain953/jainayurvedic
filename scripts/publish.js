const fs = require('fs');
const path = require('path');

// Configuration
const DATA_FILE = path.join(__dirname, '../data.json');
const STATIC_PRODUCT_FILE = path.join(__dirname, '../products.json'); // Public file for GitHub

console.log('🔄 Generating Static Menu for Cloud...');

if (!fs.existsSync(DATA_FILE)) {
    console.log('⚠️ No data.json found. Cannot generate menu.');
    process.exit(1);
}

try {
    const rawData = fs.readFileSync(DATA_FILE);
    const db = JSON.parse(rawData);

    if (!db.products) {
        console.log('⚠️ No products found in database.');
        process.exit(0);
    }

    // Extract ONLY public fields (Name, Price, Image, Category, Specs)
    // We do NOT export "Stock" (to avoid showing 0 stock bugs offline) or internal Ids if sensitive
    // Extract ONLY public fields with Asset Linking
    const publicProducts = db.products.map(p => {
        // Cleaning logic must match compressor.js
        const cleanName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

        // Check for possible extensions
        let imagePath = null;
        const extensions = ['.jpg', '.jpeg', '.png'];
        const assetsDir = path.join(__dirname, '../assets/products');

        for (const ext of extensions) {
            const filename = cleanName + ext;
            if (fs.existsSync(path.join(assetsDir, filename))) {
                imagePath = `assets/products/${filename}`; // Relative Web Path
                break;
            }
        }

        // Fallback or specific override
        if (!imagePath && p.image && p.image.startsWith('http')) {
            imagePath = p.image; // Keep existing external URLs
        }

        return {
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            brand: p.brand,
            image: imagePath || "https://via.placeholder.com/200?text=No+Image", // Link to Local Asset
            description: p.description
        };
    });

    // Write to root as products.json
    fs.writeFileSync(STATIC_PRODUCT_FILE, JSON.stringify(publicProducts, null, 2));
    console.log(`✅ Synced ${publicProducts.length} products.`);

    // ============================================
    // 2. EXPORT CUSTOMER DATA (Login, Points, History)
    // ============================================
    const STATIC_CUSTOMER_FILE = path.join(__dirname, '../customers.json');

    if (db.customers) {
        // We map the data to ensure we have a clean format
        // Structure: { "9876543210": { name: "Raj", points: 100, history: [...] } }
        const publicCustomers = {};

        Object.keys(db.customers).forEach(mobile => {
            const c = db.customers[mobile];
            publicCustomers[mobile] = {
                name: c.name,
                mobile: c.mobile,
                address: c.address,
                points: c.points || 0,
                wishlist: c.wishlist || [],
                // We can include recent order history if available in the 'bills' section or customer object
                // For now, syncing core identity and points
            };
        });

        fs.writeFileSync(STATIC_CUSTOMER_FILE, JSON.stringify(publicCustomers, null, 2));
        console.log(`✅ Synced ${Object.keys(publicCustomers).length} customers.`);
    }

} catch (error) {
    console.error('❌ Error executing sync:', error.message);
}
