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
            products: this.getDefaultProducts(),
            shop: this.getDefaultShopInfo(),
            customers: {},
            bills: [],
            requests: [],
            offers: [],
            settings: this.getDefaultSettings()
        };

        // Load static fallbacks immediately (for GitHub Pages compatibility)
        if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
            this.loadStaticFallbacks();
        } else {
            // Local mode
            this.initializeStorage();
        }

        // Start background sync
        this.startSync();
    }

    async loadStaticFallbacks() {
        try {
            const [products, customers] = await Promise.all([
                fetch('products.json?t=' + Date.now()).then(r => r.ok ? r.json() : null),
                fetch('customers.json?t=' + Date.now()).then(r => r.ok ? r.json() : null)
            ]);

            if (products) this.cache.products = products;
            if (customers) this.cache.customers = customers;

            this.notifyListeners('sync');
        } catch (e) {
            console.warn('[DataManager] Static fallback fetch failed:', e);
        }
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
            // console.error(`API GET ${endpoint} failed:`, error);
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
            // Non-blocking error for local operations if offline
            // throw error; 
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
                if (!data.settings) {
                    this.saveSettings(this.getDefaultSettings());
                }
                this.notifyListeners('sync');
            }
        }).catch(error => {
            console.warn('Storage initialization failed (Offline?): Using Init Defaults', error);
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
            adminPassword: '', // For Retailer Login (Empty = Default 1234 allowed)
            offlineBackupUrl: ''
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
                prices: [{ quantity: 1, price: 20, isDefault: true }]
            }
        ];
    }

    // ============================================
    // CORE METHODS (Required for Retailer.js)
    // ============================================

    getShopInfo() { return this.cache.shop; }
    saveShopInfo(info) {
        this.cache.shop = info;
        this.apiPost('/shop', { shop: info });
        this.notifyListeners('shop');
    }

    getSettings() { return this.cache.settings; }
    saveSettings(settings) {
        this.cache.settings = settings;
        this.apiPost('/settings', { settings });
        this.notifyListeners('settings');
    }

    getProducts() { return this.cache.products || []; }
    getProductById(id) { return this.getProducts().find(p => p.id === id); }

    saveProducts(products) {
        this.cache.products = products;
        this.apiPost('/products', { products });
        this.notifyListeners('products');
    }

    addProduct(product) {
        const products = this.getProducts();
        product.id = 'P' + Date.now();
        products.push(product);
        this.saveProducts(products);
        return product.id;
    }

    updateProduct(id, updates) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updates };
            this.saveProducts(products);
        }
    }

    // ============================================
    // BILLING & CUSTOMERS
    // ============================================

    getBills() { return this.cache.bills || []; }
    saveBills(bills) {
        this.cache.bills = bills;
        this.apiPost('/bills', { bills });
        this.notifyListeners('bills');
    }

    addBill(bill) {
        const bills = this.getBills();
        bill.billNumber = 'BILL' + Date.now();
        bill.timestamp = new Date().toISOString();
        bills.push(bill);
        this.saveBills(bills);
        return bill.billNumber;
    }

    getRequests() { return this.cache.requests || []; }
    saveRequests(requests) {
        this.cache.requests = requests;
        this.apiPost('/requests', { requests });
        this.notifyListeners('requests');
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

    getAllCustomers() { return this.cache.customers || {}; }

    getCustomerData(name, mobile) {
        const customers = this.cache.customers || {};
        const identity = this.getCustomerIdentity(name, mobile);
        if (!customers[identity]) {
            customers[identity] = {
                name: name.trim(),
                mobile: mobile.trim(),
                points: 0,
                wishlist: [],
                billHistory: []
            };
            this.cache.customers = customers;
            this.apiPost('/customers', { customers });
        }
        return customers[identity];
    }

    updateCustomerData(name, mobile, updates) {
        const customers = this.cache.customers;
        const identity = this.getCustomerIdentity(name, mobile);
        if (customers[identity]) {
            customers[identity] = { ...customers[identity], ...updates };
            this.cache.customers = customers;
            this.apiPost('/customers', { customers });
            this.notifyListeners('customers');
        }
    }

    getCustomerIdentity(name, mobile) {
        return (name.trim().toLowerCase() + '_' + mobile.toString().replace(/\D/g, ''));
    }

    // ============================================
    // OFFERS
    // ============================================

    getOffers() { return this.cache.offers || []; }
    getActiveOffers() { return this.getOffers().filter(o => o.active); }

    saveOffers(offers) {
        this.cache.offers = offers;
        this.apiPost('/offers', { offers });
        this.notifyListeners('offers');
    }

    // ============================================
    // SYNC & LISTENERS
    // ============================================

    startSync() {
        setInterval(() => {
            // Only sync if online/local server available
            if (this.apiBase && !this.apiBase.includes('undefined')) {
                this.apiGet('/data').then(data => {
                    if (data) {
                        this.updateCacheGracefully(data);
                        this.notifyListeners('sync');
                    }
                }).catch(() => { });
            }
        }, this.syncInterval);
    }

    updateCacheGracefully(data) {
        if (data.products) this.cache.products = data.products;
        if (data.shop) this.cache.shop = data.shop;
        if (data.customers) this.cache.customers = data.customers;
        if (data.bills) this.cache.bills = data.bills;
        if (data.requests) this.cache.requests = data.requests;
        if (data.offers) this.cache.offers = data.offers;
        if (data.settings) this.cache.settings = data.settings;
    }

    addListener(cb) { this.listeners.push(cb); }
    notifyListeners(type) { this.listeners.forEach(cb => cb(type)); }
}

// Initialize Global Instance
window.dataManager = new DataManager();
