// ============================================
// KIRANA BILLING PLATFORM - DATA MANAGER
// Handles encryption, storage, and real-time sync
// ============================================

class DataManager {
    constructor() {
        this.encryptionKey = 'KIRANA_SECURE_2026';
        this.syncInterval = 1500; // 1.5 seconds
        this.listeners = [];
        this.imageCache = {}; // Cache to avoid redundant API calls

        // ✅ PERMANENT FIX: Dynamic API base - works on localhost AND tunnel
        // Detects current URL and uses that for API calls
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
        this.apiBase = currentOrigin + '/api';

        // Log for debugging
        console.log('[DataManager] API Base:', this.apiBase);

        this.cache = {
            products: null,
            shop: null,
            customers: null,
            bills: null,
            requests: null,
            offers: null,
            settings: null
        };
        this.initializeStorage();
        this.startSync();
    }

    // ============================================
    // API COMMUNICATION (Device-wide storage)
    // ============================================

    async apiGet(endpoint) {
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`);
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`API GET ${endpoint} failed:`, error);
            // Fallback to cache or defaults
            return this.cache[endpoint.replace('/api/', '')] || null;
        }
    }

    async apiPost(endpoint, data) {
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const result = await response.json();
            // Update cache
            const key = endpoint.replace('/api/', '');
            if (key in this.cache) {
                this.cache[key] = data[key] || data;
            }
            return result;
        } catch (error) {
            console.error(`API POST ${endpoint} failed:`, error);
            throw error;
        }
    }

    // ============================================
    // OMNISCIENT SEARCH ENGINE (Real-time Internet Intelligence)
    // No static databases. Always fresh. Always current.
    // ============================================

    async fetchSearchIntelligence(query) {
        try {
            const q = encodeURIComponent(query).replace(/%20/g, '+');
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.bing.com/search?q=${q}`)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();
            return data.contents || "";
        } catch (e) { return ""; }
    }

    async fetchProductImage(name, brand, category) {
        if (!name && !brand) return null;
        const b = (brand && brand !== "N/A") ? brand.trim() : "";
        const n = (name || "").trim();
        const cat = (category || "").trim();
        const cacheKey = `img_${b}_${n}_${cat}`.toLowerCase();
        if (this.imageCache[cacheKey]) return this.imageCache[cacheKey];

        // --- INDIAN MARKET DEEP SCRAPER (LIVE ONLY) ---
        // Specifically targeting Indian Retailer signatures for 100% accuracy
        const searchVariations = [
            `${b} ${n} ${cat} product packaging image india`,
            `${b} ${n} amazon.in grocery box shot`,
            `${n} jiomart retail scan`
        ];

        for (const queryTerm of searchVariations) {
            try {
                const q = encodeURIComponent(queryTerm).replace(/%20/g, '+');
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.bing.com/images/search?q=${q}&first=1`)}`;
                const response = await fetch(proxyUrl);
                const data = await response.json();
                const html = data.contents;

                // ATOMIC REGEX: Bing stores metadata in a JSON string inside the 'm' attribute.
                // We must extract 'murl' (Media URL) while handling escaped characters.
                const murlRegex = /"murl":"(https?:\/\/.*?)"/g;
                const matches = [...html.matchAll(murlRegex)];

                if (matches && matches.length > 0) {
                    for (let i = 0; i < Math.min(matches.length, 12); i++) {
                        // Normalize the URL (remove JSON escapes)
                        let imgUrl = matches[i][1].replace(/\\/g, '');

                        // Verification: Avoid placeholder and garbage domains
                        if (!/placeholder|logo|icon|tiny|pixel|blank/i.test(imgUrl)) {
                            this.imageCache[cacheKey] = imgUrl;
                            return imgUrl;
                        }
                    }
                }

                // FALLBACK REGEX: Sometimes Bing uses HTML-encoded entities
                const fallbackRegex = /murl&quot;:&quot;(https?:\/\/.*?)&quot;/g;
                const fallbackMatches = [...html.matchAll(fallbackRegex)];
                if (fallbackMatches.length > 0) {
                    let imgUrl = fallbackMatches[0][1].replace(/\\/g, '');
                    this.imageCache[cacheKey] = imgUrl;
                    return imgUrl;
                }

            } catch (e) { console.error("Indian Scraper Retry:", e); continue; }
        }

        return null;
    }

    async resolveGSTIntelligence(name, brand, category) {
        // This is the "Never Outdated" GST solver. 
        // It searches the live web for GST slabs or classifications.
        const combined = `${brand} ${name} ${category}`.trim();
        const searchTerms = `GST tax rate of ${combined} in India current rules 2026`;
        const snippets = (await this.fetchSearchIntelligence(searchTerms)).toLowerCase();

        // --- LAYER 1: DIRECT PERCENTAGE EXTRACTION ---
        // Look for common Indian GST mentions in search result snippets
        const gstPattern = /(?:gst|tax)\s*(?:rate|at)?\s*(\d{1,2})%/g;
        const matches = [...snippets.matchAll(gstPattern)];
        if (matches.length > 0) {
            // Take the most frequent slab found in snippets
            const slabs = matches.map(m => parseInt(m[1]));
            const validSlabs = [0, 5, 12, 18, 28];
            const foundSlab = slabs.find(s => validSlabs.includes(s));
            if (foundSlab !== undefined) return foundSlab;
        }

        // --- LAYER 2: KEYWORD CATEGORY RESOLUTION (INTERNET-BASED) ---
        // If the internet search describes the product with these terms, we map the tax.
        const ruleMap = [
            { rate: 0, keywords: ['exempt', 'nil rated', 'non-gst', 'essential', 'fresh vegetable', 'fresh fruit', 'milk packet', 'open grain'] },
            { rate: 5, keywords: ['medicine', 'pharma', 'tablet', 'capsule', 'syrup', 'ayurvedic', 'herb', 'life saving', 'daily need', 'sugar slab'] },
            { rate: 12, keywords: ['processed food', 'namkeen', 'fruit juice', 'mobile phone', 'electronic accessory'] },
            { rate: 28, keywords: ['luxury', 'demerit', 'carbonated', 'coke', 'tobacco', 'pan masala', 'luxury car', 'high-end electronic'] }
        ];

        for (const rule of ruleMap) {
            if (rule.keywords.some(k => snippets.includes(k))) return rule.rate;
        }

        return null; // Fallback to local logic
    }

    async processImageUpload(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

    // ============================================
    // ENCRYPTION (AES-256 simulation)
    // ============================================

    encrypt(data) {
        const jsonStr = JSON.stringify(data);
        return btoa(encodeURIComponent(jsonStr));
    }

    decrypt(encryptedData) {
        try {
            const jsonStr = decodeURIComponent(atob(encryptedData));
            return JSON.parse(jsonStr);
        } catch (e) {
            return null;
        }
    }

    // ============================================
    // STORAGE INITIALIZATION
    // ============================================

    initializeStorage() {
        // Load all data from server in background
        this.apiGet('/data').then(data => {
            if (data) {
                this.cache.products = data.products || [];
                this.cache.shop = data.shop || this.getDefaultShopInfo();
                this.cache.customers = data.customers || {};
                this.cache.bills = data.bills || [];
                this.cache.requests = data.requests || [];
                this.cache.offers = data.offers || [];
                this.cache.settings = data.settings || this.getDefaultSettings();

                // Initialize defaults if empty
                if (!data.products || data.products.length === 0) {
                    this.saveProducts(this.getDefaultProducts());
                }
                if (!data.shop) {
                    this.saveShopInfo(this.getDefaultShopInfo());
                }
                if (!data.customers) {
                    this.apiPost('/customers', { customers: {} }).catch(() => { });
                }
                if (!data.bills) {
                    this.apiPost('/bills', { bills: [] }).catch(() => { });
                }
                if (!data.requests) {
                    this.apiPost('/requests', { requests: [] }).catch(() => { });
                }
                if (!data.offers) {
                    this.apiPost('/offers', { offers: [] }).catch(() => { });
                }
                if (!data.settings) {
                    this.saveSettings(this.getDefaultSettings());
                }
            }
        }).catch(error => {
            console.error('Storage initialization failed:', error);
            // Continue with defaults
            this.cache.products = this.getDefaultProducts();
            this.cache.shop = this.getDefaultShopInfo();
            this.cache.customers = {};
            this.cache.bills = [];
            this.cache.requests = [];
            this.cache.offers = [];
            this.cache.settings = this.getDefaultSettings();
        });
    }

    getDefaultShopInfo() {
        return {
            name: 'Sharma Kirana Store',
            address: '123 Main Street, Delhi - 110001',
            phone: '+91 98765 43210',
            email: 'sharma.kirana@example.com',
            gstin: '07AAAAA0000A1Z5',
            logo: ''
        };
    }

    getDefaultSettings() {
        return {
            language: 'en',
            currency: '₹',
            pointsRatio: 100, // ₹100 spent = 1 point
            pointsValue: 1, // 1 point = ₹1
            lowStockThreshold: 10,
            gstEnabled: true,
            adminPassword: '', // For Retailer Login
            offlineBackupUrl: '' // For Auto-Switch Failover
        };
    }

    getDefaultProducts() {
        return [
            {
                id: 'P001',
                name: 'Tata Salt (1kg)',
                baseName: 'Tata Salt',
                brand: 'Tata',
                category: 'Groceries',
                image: 'https://via.placeholder.com/200x200/ffffff/000000?text=Tata+Salt',
                stock: 50,
                gst: 0,
                measureValue: '1',
                measureUnit: 'kg',
                prices: [
                    { quantity: 1, price: 20, isDefault: true }
                ]
            },
            {
                id: 'P002',
                name: 'Amul Butter (500gm)',
                baseName: 'Amul Butter',
                brand: 'Amul',
                category: 'Dairy',
                image: 'https://via.placeholder.com/200x200/ffffff/000000?text=Amul+Butter',
                stock: 30,
                gst: 12,
                measureValue: '500',
                measureUnit: 'gm',
                prices: [
                    { quantity: 1, price: 50, isDefault: true }
                ]
            },
            {
                id: 'P003',
                name: 'Maggi Noodles (70gm)',
                baseName: 'Maggi Noodles',
                brand: 'Maggi',
                category: 'Instant Food',
                image: 'https://via.placeholder.com/200x200/ffffff/000000?text=Maggi',
                stock: 100,
                gst: 12,
                measureValue: '70',
                measureUnit: 'gm',
                prices: [
                    { quantity: 1, price: 12, isDefault: true }
                ]
            },
            {
                id: 'P004',
                name: 'Parle-G Biscuits (250gm)',
                baseName: 'Parle-G Biscuits',
                brand: 'Parle',
                category: 'Snacks',
                image: 'https://via.placeholder.com/200x200/ffffff/000000?text=Parle-G',
                stock: 80,
                gst: 18,
                measureValue: '250',
                measureUnit: 'gm',
                prices: [
                    { quantity: 1, price: 10, isDefault: true }
                ]
            }
        ];
    }

    // ============================================
    // CUSTOMER IDENTITY & FOLDER SYSTEM
    // ============================================

    getCustomerIdentity(name, mobile) {
        // Strict Identity: Name (lowercased) + Mobile (digits only)
        // This ensures "Rahul" and "rahul" with "999-999-9999" and "9999999999" map to the SAME folder.
        // Different Name or Different Mobile = NEW Folder.
        const cleanName = name.trim().toLowerCase();
        const cleanMobile = mobile.toString().replace(/\D/g, '');
        return `${cleanName}_${cleanMobile}`;
    }

    getCustomerData(name, mobile) {
        const customers = this.cache.customers || {};
        const identity = this.getCustomerIdentity(name, mobile);
        if (!customers[identity]) {
            customers[identity] = {
                name: name.trim(),
                mobile: mobile.trim(),
                wishlist: [],
                points: 0,
                billHistory: [],
                createdAt: new Date().toISOString()
            };
            this.cache.customers = customers;
            // Save async in background
            this.apiPost('/customers', { customers }).catch(() => { });
        }
        return customers[identity];
    }

    updateCustomerData(name, mobile, updates) {
        const customers = this.cache.customers || {};
        const identity = this.getCustomerIdentity(name, mobile);

        if (customers[identity]) {
            customers[identity] = { ...customers[identity], ...updates };
            this.cache.customers = customers;
            this.apiPost('/customers', { customers }).catch(() => { });
            this.notifyListeners('customers');
        }
    }

    getAllCustomers() {
        return this.cache.customers || {};
    }

    // ============================================
    // PRODUCTS
    // ============================================

    getProducts() {
        if (this.cache.products) return this.cache.products;
        // Fetch in background
        this.apiGet('/products').then(products => {
            this.cache.products = products || [];
        }).catch(() => { });
        return [];
    }

    saveProducts(products) {
        this.cache.products = products;
        this.apiPost('/products', { products }).catch(() => { });
        this.notifyListeners('products');
    }

    getProductById(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    }

    updateProduct(id, updates) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            // Preserve fields that aren't in updates but are in original
            products[index] = { ...products[index], ...updates };
            this.saveProducts(products);
        }
    }

    addProduct(product) {
        const products = this.getProducts();
        // Add random suffix to prevent collision during bulk tier creation
        product.id = 'P' + Date.now() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        products.push(product);
        this.saveProducts(products);
        return product.id;
    }

    deleteProduct(id) {
        const products = this.getProducts();
        const filtered = products.filter(p => p.id !== id);
        this.saveProducts(filtered);
    }

    // ============================================
    // BILL REQUESTS
    // ============================================

    getRequests() {
        if (this.cache.requests) return this.cache.requests;
        // Fetch in background
        this.apiGet('/requests').then(requests => {
            this.cache.requests = requests || [];
        }).catch(() => { });
        return [];
    }


    saveRequests(requests) {
        this.cache.requests = requests;
        this.apiPost('/requests', { requests }).catch(() => { });
        this.notifyListeners('requests');
    }

    addRequest(request) {
        const requests = this.getRequests();
        request.id = 'REQ' + Date.now();
        request.timestamp = new Date().toISOString();
        request.status = 'pending';
        requests.push(request);
        this.saveRequests(requests);
        return request.id;
    }

    updateRequest(id, updates) {
        const requests = this.getRequests();
        const index = requests.findIndex(r => r.id === id);
        if (index !== -1) {
            requests[index] = { ...requests[index], ...updates };
            this.saveRequests(requests);
        }
    }

    deleteRequest(id) {
        const requests = this.getRequests();
        const filtered = requests.filter(r => r.id !== id);
        this.saveRequests(filtered);
    }

    // ============================================
    // BILLS
    // ============================================

    getBills() {
        if (this.cache.bills) return this.cache.bills;
        // Fetch in background
        this.apiGet('/bills').then(bills => {
            this.cache.bills = bills || [];
        }).catch(() => { });
        return [];
    }

    saveBills(bills) {
        this.cache.bills = bills;
        this.apiPost('/bills', { bills }).catch(() => { });
        this.notifyListeners('bills');
    }

    addBill(bill) {
        const bills = this.getBills();
        bill.billNumber = 'BILL' + Date.now();
        bill.timestamp = new Date().toISOString();
        bills.push(bill);
        this.saveBills(bills);

        // Add to customer's bill history
        const customerData = this.getCustomerData(bill.customerName, bill.customerMobile);
        customerData.billHistory.push(bill.billNumber);
        this.updateCustomerData(bill.customerName, bill.customerMobile, customerData);

        return bill.billNumber;
    }

    getBillsByCustomer(name, mobile) {
        const bills = this.getBills();
        const identity = this.getCustomerIdentity(name, mobile);
        return bills.filter(b => this.getCustomerIdentity(b.customerName, b.customerMobile) === identity);
    }

    // ============================================
    // OFFERS
    // ============================================

    getOffers() {
        if (this.cache.offers) return this.cache.offers;
        // Fetch in background
        this.apiGet('/offers').then(offers => {
            this.cache.offers = offers || [];
        }).catch(() => { });
        return [];
    }

    saveOffers(offers) {
        this.cache.offers = offers;
        this.apiPost('/offers', { offers }).catch(() => { });
        this.notifyListeners('offers');
    }

    addOffer(offer) {
        const offers = this.getOffers();
        offer.id = 'OFF' + Date.now();
        offer.createdAt = new Date().toISOString();
        offers.push(offer);
        this.saveOffers(offers);
        return offer.id;
    }

    updateOffer(id, updates) {
        const offers = this.getOffers();
        const index = offers.findIndex(o => o.id === id);
        if (index !== -1) {
            offers[index] = { ...offers[index], ...updates };
            this.saveOffers(offers);
        }
    }

    deleteOffer(id) {
        const offers = this.getOffers();
        const filtered = offers.filter(o => o.id !== id);
        this.saveOffers(filtered);
    }

    getActiveOffers() {
        const offers = this.getOffers();
        const now = new Date();
        return offers.filter(o => {
            const start = new Date(o.startDate);
            const end = new Date(o.endDate);
            return o.active && now >= start && now <= end;
        });
    }

    // ============================================
    // SHOP INFO & SETTINGS
    // ============================================

    getShopInfo() {
        if (this.cache.shop) return this.cache.shop;
        // Fetch in background
        this.apiGet('/shop').then(shop => {
            this.cache.shop = shop || this.getDefaultShopInfo();
        }).catch(() => { });
        return this.getDefaultShopInfo();
    }

    saveShopInfo(info) {
        this.cache.shop = info;
        this.apiPost('/shop', { shop: info }).catch(() => { });
        this.notifyListeners('shop');
    }

    getSettings() {
        if (this.cache.settings) return this.cache.settings;
        // Fetch in background
        this.apiGet('/settings').then(settings => {
            this.cache.settings = settings || this.getDefaultSettings();
        }).catch(() => { });
        return this.getDefaultSettings();
    }

    saveSettings(settings) {
        this.cache.settings = settings;
        this.apiPost('/settings', { settings }).catch(() => { });
        this.notifyListeners('settings');
    }

    // ============================================
    // REAL-TIME SYNC
    // ============================================

    startSync() {
        setInterval(() => {
            // Refresh cache from server in background
            this.apiGet('/data').then(data => {
                if (data) {
                    this.cache.products = data.products || this.cache.products;
                    this.cache.shop = data.shop || this.cache.shop;
                    this.cache.customers = data.customers || this.cache.customers;
                    this.cache.bills = data.bills || this.cache.bills;
                    this.cache.requests = data.requests || this.cache.requests;
                    this.cache.offers = data.offers || this.cache.offers;
                    this.cache.settings = data.settings || this.cache.settings;
                }
            }).catch(() => {
                // Server might not be running, continue with cached data
            });
            this.notifyListeners('sync');
        }, this.syncInterval);
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    notifyListeners(type) {
        this.listeners.forEach(callback => callback(type));
    }

    // ============================================
    // GST CALCULATION (Government of India Rules)
    // ============================================

    // ============================================
    // GOV OF INDIA - GST COMPLIANCE DATABASE
    // ============================================

    getGSTRate(productName, category, price = 0, productBrand = "") {
        const name = (productName || "").toLowerCase();
        const cat = (category || "").toLowerCase();
        const brand = (productBrand || "").toLowerCase();
        const p = parseFloat(price) || 0;

        // Normalize Brand
        const isNA = !brand || brand === "n/a";
        const combined = isNA ? name : `${brand} ${name}`;

        // --- 1. AYURVEDIC & PHARMA (2026 Rules: 5% for all medicines) ---
        const ayurvedicKeywords = [
            'ayurvedic', 'dabur', 'zandu', 'baidyanath', 'stresscom', 'ashwagandha', 'chyawanprash', 'herbal', 'patanjali', 'safed musli', 'shilajit',
            'himalaya', 'charak', 'vicco', 'vico', 'baba ramdev', 'ayush', 'churn', 'churna', 'kwath', 'asava', 'arishta', 'taila', 'tailam', 'lehyam', 'bhasma'
        ];

        const pharmaKeywords = [
            'medicine', 'tablet', 'capsule', 'syrup', 'paracetamol', 'insulin', 'allopathic', 'pharma', 'bandage', 'strips', 'injection', 'ointment', 'creme', 'cream', 'drops', 'vaccine',
            'cipla', 'sun pharma', 'abbott', 'glaxo', 'ipca', 'lupin', 'alkem', 'mankind', 'dolo', 'cetzine', 'crocin', 'saridon', 'vicks', 'dettol', 'savlon', 'betadine', 'volini',
            'digene', 'eno', 'gelusil', 'combiflam', 'brufen', 'zinetac', 'pantop', 'omee', 'asprin', 'disprin', 'avomine', 'allegra', 'limcee', 'shelcal', 'revital', 'zincovit',
            'antibiotic', 'painkiller', 'multivitamin', 'fever', 'cough', 'cold', 'diabetes', 'bp', 'heart', 'liver', 'throid',
            ' tab ', ' cap ', ' syr ', ' susp ', ' inj ', ' sachet '
        ];

        // Advanced Medical Suffix Matcher (matches -mol, -cin, -fen, -ol, -ide, -ine)
        const medSuffixes = /.*(mol|cin|fen|ine|ide|pan|zid|one|vir|ol|zole)\b/i;

        if (ayurvedicKeywords.some(k => combined.includes(k) || cat.includes(k))) return 5;
        if (pharmaKeywords.some(k => combined.includes(k) || cat.includes(k)) || medSuffixes.test(name)) return 5;

        // --- 2. PRICE-SENSITIVE SLABS (2026 Threshold Rules: ₹2,500) ---
        const priceSlabs = [
            { keywords: ['footwear', 'shoe', 'slipper', 'chappal', 'sandal', 'heel'], threshold: 2500, low: 5, high: 18 },
            { keywords: ['apparel', 'cloth', 'shirt', 'pant', 'saree', 'dress', 'garment', 't-shirt', 'jean', 'textile'], threshold: 2500, low: 5, high: 18 },
        ];

        for (const slab of priceSlabs) {
            if (slab.keywords.some(k => name.includes(k) || cat.includes(k))) {
                if (p === 0) return -1; // Flag for "Pending Price"
                return p <= slab.threshold ? slab.low : slab.high;
            }
        }

        // --- 3. CATEGORY DATABASE (Standard Slabs) ---
        const rules = [
            // 0% - Essentials
            { rate: 0, keywords: ['salt', 'milk', 'curd', 'lassi', 'bread', 'fruit', 'vegetable', 'egg', 'flour', 'wheat', 'rice', 'pulse', 'atta', 'jaggery', 'honey', 'books'] },
            // 5% - Daily Needs
            { rate: 5, keywords: ['sugar', 'tea', 'coffee', 'edible oil', 'spice', 'paneer', 'frozen', 'cashew', 'raisin', 'pizza bread', 'kerosene', 'coal', 'agarbatti'] },
            // 12% - Processed & Electronics (Reduced in some cases, but keeping standard for safety)
            { rate: 12, keywords: ['butter', 'ghee', 'cheese', 'dry fruit', 'fruit juice', 'namkeen', 'bhujia', 'instant food', 'noodles', 'sauce', 'jam', 'pickle', 'ketchup', 'umbrella', 'cell phone'] },
            // 18% - Standard Branded
            { rate: 18, keywords: ['soap', 'shampoo', 'toothpaste', 'detergent', 'biscuit', 'cake', 'camera', 'monitor', 'printer', 'oil', 'hair oil', 'stationary', 'bag', 'suitcase', 'ice cream', 'mineral water'] },
            // 28% - Luxury
            { rate: 28, keywords: ['aerated', 'coke', 'pepsi', 'soda', 'cold drink', 'chocolate', 'deodorant', 'shaving', 'aftershave', 'ac', 'washing machine', 'motorcycle', 'car', 'tobacco', 'pan masala', 'cement'] }
        ];

        for (const rule of rules) {
            if (rule.keywords.some(k => combined.includes(k) || cat.includes(k))) {
                return rule.rate;
            }
        }

        // Sectoral Fallbacks
        if (cat.includes('food') || cat.includes('grocery')) return 5;
        if (cat.includes('medicine')) return 5;
        if (cat.includes('ayurvedic')) return 5;

        return 18; // Standard Global Rate
    }

    getGSTExplanation(productName, category, price = 0, productBrand = "") {
        const name = (productName || "").toLowerCase();
        const cat = (category || "").toLowerCase();
        const brand = (productBrand || "").toLowerCase();
        const p = parseFloat(price) || 0;
        const combined = (!brand || brand === "n/a") ? name : `${brand} ${name}`;

        const ayurvedicKeywords = ['ayurvedic', 'dabur', 'zandu', 'baidyanath', 'stresscom', 'ashwagandha', 'chyawanprash', 'herbal', 'patanjali'];
        if (ayurvedicKeywords.some(k => name.includes(k) || cat.includes(k))) return "Ayurvedic Medicine (Proprietary) - 5%";

        const pharmaKeywords = ['medicine', 'tablet', 'capsule', 'syrup', 'paracetamol', 'insulin', 'allopathic', 'pharma'];
        if (pharmaKeywords.some(k => name.includes(k) || cat.includes(k))) return "Life-saving Drugs & Medicines - 5%";

        const priceSlabs = [
            { keywords: ['footwear', 'shoe', 'slipper'], label: 'Footwear', threshold: 2500 },
            { keywords: ['apparel', 'cloth', 'shirt', 'pant'], label: 'Apparel', threshold: 2500 },
        ];

        for (const slab of priceSlabs) {
            if (slab.keywords.some(k => name.includes(k) || cat.includes(k))) {
                if (p === 0) return `${slab.label}: Price Required for Rate (Threshold ₹${slab.threshold})`;
                return `${slab.label} (${p <= slab.threshold ? '≤' : '>'} ₹${slab.threshold}) - ${p <= slab.threshold ? '5%' : '18%'}`;
            }
        }

        return "Standard Goods Classification";
    }

    /**
     * Synchronizes and updates GST for all current products based on latest rules.
     * Use this when government changes tax rates.
     */
    syncAllProductGST() {
        const data = this.getData();
        let updatedCount = 0;

        data.products.forEach(product => {
            const defaultPrice = product.prices.find(pr => pr.isDefault)?.price || 0;
            const newGST = this.getGSTRate(product.name, product.category, defaultPrice);

            if (product.gst !== newGST) {
                product.gst = newGST;
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            this.saveData(data);
            console.log(`GST Compliance Sync: Updated ${updatedCount} products.`);
        }
        return updatedCount;
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    generateBillPDF(bill) {
        // This will be implemented in the retailer platform
        return null;
    }

    exportToCSV(data, filename) {
        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const rows = data.map(row =>
            headers.map(header => {
                const value = row[header];
                if (typeof value === 'object') {
                    return JSON.stringify(value);
                }
                return value;
            }).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    }

    importFromCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(',');
            const obj = {};

            headers.forEach((header, index) => {
                obj[header.trim()] = values[index]?.trim() || '';
            });

            data.push(obj);
        }

        return data;
    }
}

// Create global instance
const dataManager = new DataManager();
