/**
 * CUSTOMER PLATFORM - REBUILT V3.0
 * Verified Syntax / Immediate Render / Premium UI
 */

class CustomerApp {
    constructor() {
        this.currentView = 'login';
        this.customerName = '';
        this.customerMobile = '';
        this.cart = [];
        this.wishlist = [];
        this.points = 0;
        this.allProducts = [];
        this.isOffline = true; // Default to static data until tunnel check passes

        this.filters = {
            search: '',
            category: 'all'
        };

        this.init();
    }

    init() {
        console.log('🚀 Initializing Kirana Customer App...');

        // 1. Restore local session
        const saved = sessionStorage.getItem('customer');
        if (saved) {
            try {
                const { name, mobile } = JSON.parse(saved);
                this.customerName = name;
                this.customerMobile = mobile;
                this.currentView = 'products';
            } catch (e) { sessionStorage.removeItem('customer'); }
        }

        // 2. Load Static Data (Baked-in Laptop Data)
        this.loadLockedData();

        // 3. Initial Render
        this.render();

        // 4. Background Sync Listener
        window.dataManager.addListener(() => this.render());
    }

    async loadLockedData() {
        try {
            console.log('🔄 Syncing laptop database...');
            const [pRes, cRes] = await Promise.all([
                fetch('products.json?t=' + Date.now()),
                fetch('customers.json?t=' + Date.now())
            ]);

            if (pRes.ok) this.allProducts = await pRes.json();

            if (cRes.ok && this.customerMobile) {
                const customers = await cRes.json();
                const identity = this.customerName.trim().toLowerCase() + '_' + this.customerMobile.replace(/\D/g, '');
                const user = customers[identity] || customers[this.customerMobile];
                if (user) {
                    this.points = user.points || 0;
                    this.wishlist = user.wishlist || [];
                    console.log('✅ Loyalty data synced:', this.points, 'points');
                }
            }
            this.render();
        } catch (e) {
            console.warn('⚠️ Sync fallback active');
        }
    }

    render() {
        const app = document.getElementById('app');
        if (!app) return;

        if (this.currentView === 'login') {
            app.innerHTML = this.renderLogin();
        } else {
            app.innerHTML = `
                ${this.renderHeader()}
                ${this.renderContent()}
            `;
        }
        this.attachEvents();
    }

    renderLogin() {
        return `
            <div class="login-wrapper">
                <div class="login-card">
                    <div class="login-header">
                        <div class="login-icon">🛒</div>
                        <h1>Jai Ayurvedic <span class="highlight">Shop</span></h1>
                        <p>Welcome! Please login to your premium bazar.</p>
                    </div>
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" id="custName" placeholder="Full Name" required value="${this.customerName}">
                        </div>
                        <div class="form-group">
                            <label>Mobile</label>
                            <input type="tel" id="custMobile" placeholder="10-digit Mobile" required pattern="[6-9][0-9]{9}" maxlength="10" value="${this.customerMobile}">
                        </div>
                        <button type="submit" class="btn-login">Enter Shop 🔓</button>
                    </form>
                </div>
            </div>
        `;
    }

    renderHeader() {
        return `
            <header class="customer-header">
                <div class="shop-info">
                    <h1>Ayurvedic Shop</h1>
                    <p>Loyalty Member: <b>${this.customerName}</b></p>
                </div>
                <div class="customer-info">
                    <span class="customer-points">⭐ ${this.points} Points</span>
                    <button onclick="app.logout()" class="btn-logout">Exit</button>
                </div>
            </header>
        `;
    }

    renderContent() {
        const products = this.allProducts;
        return `
            <div class="customer-container">
                <div class="products-grid">
                    ${products.map(p => {
            // Get default price from prices array
            const defaultPrice = p.prices && p.prices.length > 0
                ? p.prices.find(pr => pr.isDefault)?.price || p.prices[0].price
                : 0;

            return `
                        <div class="product-card">
                            <div class="product-image-container">
                                <img src="${p.image}" onerror="this.src='https://via.placeholder.com/200?text=${encodeURIComponent(p.name)}'">
                            </div>
                            <div class="product-info">
                                <p class="product-brand">${p.brand}</p>
                                <h3 class="product-name">${p.name}</h3>
                                <p class="product-measure">${p.measureValue} ${p.measureUnit}</p>
                                <div class="product-price">₹${defaultPrice}</div>
                                <button class="btn-add" onclick="alert('Adding to cloud request...')">Add to Cart</button>
                            </div>
                        </div>
                    `}).join('')}
                </div>
                ${products.length === 0 ? '<p style="text-align:center; padding:40px;">Syncing products from laptop...</p>' : ''}
            </div>
        `;
    }

    handleLogin(e) {
        e.preventDefault();
        const name = document.getElementById('custName').value;
        const mobile = document.getElementById('custMobile').value;

        this.customerName = name;
        this.customerMobile = mobile;
        sessionStorage.setItem('customer', JSON.stringify({ name, mobile }));

        this.currentView = 'products';
        this.loadLockedData(); // Refresh points immediately
        this.render();
    }

    logout() {
        sessionStorage.clear();
        window.location.reload();
    }

    attachEvents() {
        const form = document.getElementById('loginForm');
        if (form) form.onsubmit = (e) => this.handleLogin(e);
    }
}

// Global App Instance
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CustomerApp();
});
