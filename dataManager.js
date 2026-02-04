/**
 * KIRANA DATA MANAGER - Simplified V2.0
 */
class DataManager {
    constructor() {
        this.listeners = [];
        this.cache = { products: [], customers: {} };
        this.apiBase = window.location.origin + '/api';
        this.init();
    }

    init() {
        // Just a ping for now, doesn't block
        fetch(this.apiBase + '/shop').catch(() => { });
    }

    addListener(cb) { this.listeners.push(cb); }
    notify() { this.listeners.forEach(cb => cb()); }

    // Stub methods for compatibility with existing code
    getProducts() { return this.cache.products; }
    getCustomerData(name, mobile) { return this.cache.customers[mobile] || {}; }
}

window.dataManager = new DataManager();
