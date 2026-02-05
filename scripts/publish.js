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

        // Extract default price
        let defaultPrice = p.price || 0;
        if (p.prices && p.prices.length > 0) {
            const def = p.prices.find(tier => tier.isDefault) || p.prices[0];
            defaultPrice = def.price;
        }

        // Find applicable offer label
        let offerLabel = null;
        if (db.offers) {
            const applicableOffer = db.offers.find(offer => {
                if (!offer.applicableProducts || offer.applicableProducts.length === 0) return true;
                return offer.applicableProducts.includes(p.id);
            });
            if (applicableOffer) {
                offerLabel = applicableOffer.label || `${applicableOffer.discount}% OFF`;
            }
        }

        return {
            id: p.id,
            name: p.name,
            price: defaultPrice,
            category: p.category,
            brand: p.brand,
            stock: p.stock || 0, // Include stock for quantity validation
            image: imagePath || "https://via.placeholder.com/200?text=No+Image",
            description: p.description,
            offerLabel: offerLabel
        };
    });

    // Get shop info and settings
    const shopInfo = db.shop || {
        name: "Jain Ayurvedic",
        phone: "+91 9876543210",
        address: ""
    };

    const settings = db.settings || {
        gstRate: 18,
        pointsRatio: 10,
        currency: "₹",
        adminPassword: "admin123"
    };

    // Filter active offers (valid until date hasn't passed)
    const now = new Date();
    const activeOffers = (db.offers || [])
        .filter(offer => {
            if (!offer.validUntil) return true;
            return new Date(offer.validUntil) > now;
        })
        .map(offer => ({
            id: offer.id,
            type: offer.type || 'percentage',
            condition: offer.condition || {},
            discount: offer.discount,
            discountType: offer.discountType || 'percentage',
            applicableProducts: offer.applicableProducts || [],
            validUntil: offer.validUntil,
            label: offer.label
        }));

    // Read backend hint from api_config.json if exists
    let backendHint = null;
    const apiConfigPath = path.join(__dirname, '../api_config.json');
    if (fs.existsSync(apiConfigPath)) {
        try {
            const apiConfig = JSON.parse(fs.readFileSync(apiConfigPath));
            backendHint = apiConfig.tunnelUrl || apiConfig.backendUrl;
        } catch (e) {
            console.log('⚠️ Could not read api_config.json');
        }
    }

    // Create comprehensive snapshot
    const snapshot = {
        shop: {
            name: shopInfo.name,
            phone: shopInfo.phone || settings.phone || "+91 9876543210",
            address: shopInfo.address || "",
            lastUpdated: new Date().toISOString()
        },
        settings: {
            gstRate: settings.gstRate || 18,
            pointsRatio: settings.pointsRatio || 10,
            currency: settings.currency || "₹"
        },
        offers: activeOffers,
        products: publicProducts,
        backendAvailabilityHint: backendHint
    };

    // Write to root as products.json
    fs.writeFileSync(STATIC_PRODUCT_FILE, JSON.stringify(snapshot, null, 2));
    console.log(`✅ Synced ${publicProducts.length} products with ${activeOffers.length} active offers.`);

    console.log('');
    console.log('━'.repeat(50));
    console.log('📊 Snapshot Summary:');
    console.log(`   Products: ${publicProducts.length}`);
    console.log(`   Active Offers: ${activeOffers.length}`);
    console.log(`   GST Rate: ${snapshot.settings.gstRate}%`);
    console.log(`   Points Ratio: ${snapshot.settings.pointsRatio}`);
    console.log(`   Backend URL: ${snapshot.backendAvailabilityHint || 'Not set'}`);
    console.log('━'.repeat(50));
    console.log('');
    console.log('✅ Snapshot generated successfully!');
    console.log('🔒 Customer data NOT included (privacy protected)');
    console.log('ℹ️  Customer data accessible via backend API only');
    console.log('');

} catch (error) {
    console.error('❌ Error executing sync:', error.message);
}
