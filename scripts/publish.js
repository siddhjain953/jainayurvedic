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
    const publicProducts = db.products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        brand: p.brand,
        image: p.image || null, // Ensure image path is clean
        description: p.description
    }));

    // Write to root as products.json
    fs.writeFileSync(STATIC_PRODUCT_FILE, JSON.stringify(publicProducts, null, 2));
    console.log(`✅ Successfully exported ${publicProducts.length} products to products.json`);

} catch (error) {
    console.error('❌ Error generating static menu:', error.message);
}
