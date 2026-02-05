// ============================================
// SYNC TO GITHUB - DATA EXTRACTION SCRIPT
// Automatically syncs retailer data to public GitHub format
// ============================================

const fs = require('fs');
const path = require('path');

// Paths
const DATA_FILE = path.join(__dirname, '../data.json');
const PRODUCTS_OUTPUT = path.join(__dirname, '../products.json');
const CUSTOMERS_OUTPUT = path.join(__dirname, '../customers.json');
const SHOP_OUTPUT = path.join(__dirname, '../shop.json');

console.log('🔄 Starting GitHub Data Sync...\n');

// Read retailer data
let data;
try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    data = JSON.parse(rawData);
    console.log('✅ Loaded data.json');
} catch (error) {
    console.error('❌ Failed to read data.json:', error.message);
    process.exit(1);
}

// ============================================
// 1. SYNC PRODUCTS (Remove stock, keep images)
// ============================================
const publicProducts = data.products.map(p => ({
    id: p.id,
    name: p.name,
    baseName: p.baseName,
    brand: p.brand,
    category: p.category,
    image: p.image,
    measureValue: p.measureValue,
    measureUnit: p.measureUnit,
    prices: p.prices,
    gst: p.gst
    // NOTE: Stock is NOT included for privacy/offline mode
}));

fs.writeFileSync(PRODUCTS_OUTPUT, JSON.stringify(publicProducts, null, 2));
console.log(`✅ Synced ${publicProducts.length} products to products.json`);

// ============================================
// 2. SYNC CUSTOMERS (Keep points, wishlist, history)
// ============================================
const publicCustomers = {};
for (const [key, customer] of Object.entries(data.customers)) {
    publicCustomers[key] = {
        name: customer.name,
        mobile: customer.mobile,
        points: customer.points || 0,
        wishlist: customer.wishlist || [],
        billHistory: customer.billHistory || [],
        createdAt: customer.createdAt
    };
}

fs.writeFileSync(CUSTOMERS_OUTPUT, JSON.stringify(publicCustomers, null, 2));
console.log(`✅ Synced ${Object.keys(publicCustomers).length} customers to customers.json`);

// ============================================
// 3. SYNC SHOP INFO (Public information only)
// ============================================
const publicShop = {
    name: data.shop.name,
    address: data.shop.address,
    phone: data.shop.phone,
    email: data.shop.email || '',
    logo: data.shop.logo || ''
    // NOTE: GSTIN is NOT included
};

fs.writeFileSync(SHOP_OUTPUT, JSON.stringify(publicShop, null, 2));
console.log(`✅ Synced shop info to shop.json`);

console.log('\n✅ GitHub Sync Complete!');
console.log('📤 Ready to commit and push to GitHub\n');
