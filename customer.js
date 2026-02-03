// ============================================
// CUSTOMER PLATFORM - MAIN APPLICATION
// ============================================

class CustomerApp {
    constructor() {
        this.currentView = 'login';
        this.customerName = '';
        this.customerMobile = '';
        this.cart = [];
        this.wishlist = [];
        this.points = 0;
        this.filters = {
            search: '',
            category: 'all',
            brand: 'all',
            stockOnly: false,
            priceMin: 0,
            priceMax: 10000
        };
        this.sortBy = 'name-asc';
        this.pointsToUse = 0;

        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedCustomer = sessionStorage.getItem('customer');
        if (savedCustomer) {
            const { name, mobile } = JSON.parse(savedCustomer);
            this.customerName = name;
            this.customerMobile = mobile;
            this.loadCustomerData();
            this.currentView = 'products';
        }

        // Listen for data changes
        dataManager.addListener((type) => {
            // CRITICAL FIX: Don't re-render on sync events during login to prevent input clearing
            if (type === 'sync' && this.currentView === 'login') {
                return; // Skip re-render during login
            }

            if (type === 'sync' || type === 'requests' || type === 'bills') {
                this.render();
            }
        });

        // ===================================
        // SMART FAILOVER (HEARTBEAT)
        // ===================================
        setInterval(() => {
            this.checkConnection();
        }, 5000); // Check every 5 seconds

        this.render();
    }

    async checkConnection() {
        try {
            // Try to fetch a lightweight resource
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const response = await fetch('/api/shop', {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                // We are ONLINE
                const offlineBadge = document.getElementById('offline-warning-badge');
                if (offlineBadge) offlineBadge.remove();
            } else {
                throw new Error('Server returned error');
            }
        } catch (error) {
            // We are OFFLINE
            console.log('Connection Lost. Switching to Offline Mode...');
            this.isOffline = true;

            // Show Offline Badge
            if (!document.getElementById('offline-badge')) {
                const badge = document.createElement('div');
                badge.id = 'offline-badge';
                badge.innerHTML = `⚠️ Offline Mode (WhatsApp Ordering Only)`;
                badge.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#ff9800;color:black;text-align:center;padding:5px;z-index:9999;font-weight:bold;font-size:12px;';
                document.body.prepend(badge);
            }

            // Try to load static menu if not loaded
            if (this.allProducts.length === 0) {
                this.loadStaticMenu();
            }


            if (settings && settings.offlineBackupUrl) {
                // AUTO-SWITCH
                window.location.href = settings.offlineBackupUrl;
            } else {
                // Show Warning if no backup URL configured
                if (!document.getElementById('offline-warning-badge')) {
                    const badge = document.createElement('div');
                    badge.id = 'offline-warning-badge';
                    badge.innerHTML = `⚠️ Connection Lost. <button onclick="location.reload()">Retry</button>`;
                    badge.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#ff5722;color:white;text-align:center;padding:10px;z-index:9999;font-weight:bold;';
                    document.body.prepend(badge);
                }
            }
        }
    }

    loadCustomerData() {
        const customerData = dataManager.getCustomerData(this.customerName, this.customerMobile);
        this.wishlist = customerData.wishlist || [];
        this.points = customerData.points || 0;
    }

    saveCustomerData() {
        dataManager.updateCustomerData(this.customerName, this.customerMobile, {
            wishlist: this.wishlist,
            points: this.points
        });
    }

    // ============================================
    // AUTHENTICATION
    // ============================================

    handleLogin(name, mobile) {
        // Validate Indian mobile number
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(mobile)) {
            alert('Please enter a valid 10-digit Indian mobile number');
            return;
        }

        if (!name.trim()) {
            alert('Please enter your name');
            return;
        }

        this.customerName = name.trim();
        this.customerMobile = mobile.trim();

        // Save to session
        sessionStorage.setItem('customer', JSON.stringify({
            name: this.customerName,
            mobile: this.customerMobile
        }));

        // Load customer data
        this.loadCustomerData();

        this.currentView = 'products';
        this.render();
    }

    handleLogout() {
        sessionStorage.removeItem('customer');
        this.customerName = '';
        this.customerMobile = '';
        this.cart = [];
        this.wishlist = [];
        this.points = 0;
        this.currentView = 'login';
        this.render();
    }

    // ============================================
    // PRODUCT FILTERING & SORTING
    // ============================================

    getFilteredProducts() {
        let products = this.isOffline ? (this.allProducts || []) : dataManager.getProducts();
        const activeOffers = dataManager.getActiveOffers();

        // Apply search filter
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(search) ||
                p.brand.toLowerCase().includes(search)
            );
        }

        // Apply category filter
        if (this.filters.category !== 'all') {
            products = products.filter(p => p.category === this.filters.category);
        }

        // Apply brand filter
        if (this.filters.brand !== 'all') {
            products = products.filter(p => p.brand === this.filters.brand);
        }

        // Apply stock filter
        if (this.filters.stockOnly) {
            products = products.filter(p => p.stock > 0);
        }

        // Apply price filter
        products = products.filter(p => {
            const defaultPrice = this.getDefaultPrice(p);
            return defaultPrice >= this.filters.priceMin && defaultPrice <= this.filters.priceMax;
        });

        // Apply sorting
        products = this.sortProducts(products);

        // Add offer information
        products = products.map(p => {
            const applicableOffers = this.getApplicableOffers(p, activeOffers);
            return { ...p, offers: applicableOffers };
        });

        return products;
    }

    sortProducts(products) {
        const sorted = [...products];

        switch (this.sortBy) {
            case 'name-asc':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                sorted.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'price-asc':
                sorted.sort((a, b) => this.getDefaultPrice(a) - this.getDefaultPrice(b));
                break;
            case 'price-desc':
                sorted.sort((a, b) => this.getDefaultPrice(b) - this.getDefaultPrice(a));
                break;
            case 'stock':
                sorted.sort((a, b) => b.stock - a.stock);
                break;
        }

        return sorted;
    }

    getDefaultPrice(product) {
        const defaultPriceTier = product.prices.find(p => p.isDefault);
        return defaultPriceTier ? defaultPriceTier.price : product.prices[0].price;
    }

    getCategories() {
        const products = dataManager.getProducts();
        const categories = [...new Set(products.map(p => p.category))];
        return categories.sort();
    }

    getBrands() {
        const products = dataManager.getProducts();
        const brands = [...new Set(products.map(p => p.brand))];
        return brands.sort();
    }

    // ============================================
    // OFFERS LOGIC
    // ============================================

    getApplicableOffers(product, offers) {
        const applicable = [];

        for (const offer of offers) {
            // Check if offer applies to this product
            if (offer.applicationType === 'product' && offer.productIds.includes(product.id)) {
                applicable.push(offer);
            } else if (offer.applicationType === 'category' && offer.categories.includes(product.category)) {
                applicable.push(offer);
            } else if (offer.applicationType === 'all') {
                applicable.push(offer);
            }
        }

        return applicable;
    }

    calculateOfferDiscount(product, quantity, offers) {
        let maxDiscount = 0;
        let appliedOffer = null;

        for (const offer of offers) {
            // Check if customer is eligible (Welcome offer check)
            if (offer.type === 'welcome') {
                const customerBills = dataManager.getBillsByCustomer(this.customerName, this.customerMobile);
                if (customerBills.length > 0) {
                    continue; // Skip welcome offer for existing customers
                }
            }

            // Check minimum quantity
            if (offer.minQuantity && quantity < offer.minQuantity) {
                continue;
            }

            let discount = 0;
            const basePrice = this.getDefaultPrice(product) * quantity;

            switch (offer.type) {
                case 'percentage':
                case 'welcome':
                case 'festival':
                case 'clearance':
                    discount = (basePrice * offer.discountValue) / 100;
                    break;

                case 'fixed':
                    discount = offer.discountValue;
                    break;

                case 'bogo':
                    // Buy X Get Y free
                    const freeItems = Math.floor(quantity / (offer.buyQuantity + offer.getQuantity)) * offer.getQuantity;
                    discount = freeItems * this.getDefaultPrice(product);
                    break;

                case 'bulk':
                    if (quantity >= offer.minQuantity) {
                        discount = (basePrice * offer.discountValue) / 100;
                    }
                    break;
            }

            if (discount > maxDiscount) {
                maxDiscount = discount;
                appliedOffer = offer;
            }
        }

        return { discount: maxDiscount, offer: appliedOffer };
    }

    // ============================================
    // CART MANAGEMENT
    // ============================================

    addToCart(productId, quantity = 1) {
        const product = dataManager.getProductById(productId);
        if (!product) return;

        // Check stock availability
        const existingItem = this.cart.find(item => item.productId === productId);
        const currentQty = existingItem ? existingItem.quantity : 0;
        const newQty = currentQty + quantity;

        if (newQty > product.stock) {
            alert(`Only ${product.stock} units available in stock`);
            return;
        }

        if (existingItem) {
            existingItem.quantity = newQty;
        } else {
            this.cart.push({ productId, quantity });
        }

        this.render();
    }

    updateCartQuantity(productId, quantity) {
        const product = dataManager.getProductById(productId);
        if (!product) return;

        if (quantity > product.stock) {
            alert(`Only ${product.stock} units available in stock`);
            return;
        }

        if (quantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        const item = this.cart.find(item => item.productId === productId);
        if (item) {
            item.quantity = quantity;
            this.render();
        }
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.productId !== productId);
        this.render();
    }

    clearCart() {
        this.cart = [];
        this.pointsToUse = 0;
        this.render();
    }

    // ============================================
    // WISHLIST MANAGEMENT
    // ============================================

    toggleWishlist(productId) {
        const index = this.wishlist.indexOf(productId);
        if (index > -1) {
            this.wishlist.splice(index, 1);
        } else {
            this.wishlist.push(productId);
        }
        this.saveCustomerData();
        this.render();
    }

    isInWishlist(productId) {
        return this.wishlist.includes(productId);
    }

    // ============================================
    // BILL CALCULATION
    // ============================================

    calculateCartTotal() {
        let subtotal = 0;
        let totalGST = 0;
        let totalOfferDiscount = 0;
        const items = [];

        for (const cartItem of this.cart) {
            const product = dataManager.getProductById(cartItem.productId);
            if (!product) continue;

            const basePrice = this.getDefaultPrice(product);
            const itemSubtotal = basePrice * cartItem.quantity;

            // Calculate offer discount
            const activeOffers = dataManager.getActiveOffers();
            const { discount, offer } = this.calculateOfferDiscount(
                product,
                cartItem.quantity,
                activeOffers
            );

            const priceAfterOffer = itemSubtotal - discount;
            const gstAmount = (priceAfterOffer * product.gst) / 100;

            subtotal += itemSubtotal;
            totalOfferDiscount += discount;
            totalGST += gstAmount;

            items.push({
                product,
                quantity: cartItem.quantity,
                basePrice,
                itemSubtotal,
                offerDiscount: discount,
                appliedOffer: offer,
                gstAmount,
                total: priceAfterOffer + gstAmount
            });
        }

        const totalBeforePoints = subtotal - totalOfferDiscount + totalGST;

        // Calculate points discount (Clamped to Bill Total)
        const settings = dataManager.getSettings();
        // Cap points usage to what's needed for the bill
        const maxPointsNeeded = Math.ceil(totalBeforePoints / settings.pointsValue);
        const maxPointsUsable = Math.min(this.pointsToUse, this.points, maxPointsNeeded);

        const pointsDiscount = maxPointsUsable * settings.pointsValue;
        const grandTotal = Math.max(0, totalBeforePoints - pointsDiscount);

        return {
            items,
            subtotal,
            totalOfferDiscount,
            totalGST,
            totalBeforePoints,
            pointsDiscount,
            pointsUsed: maxPointsUsable,
            grandTotal
        };
    }

    // ============================================
    // BILL SUBMISSION
    // ============================================

    submitBillRequest() {
        if (this.cart.length === 0) {
            alert('Your cart is empty');
            return;
        }

        const calculation = this.calculateCartTotal();

        // Verify stock availability one more time
        for (const item of calculation.items) {
            if (item.quantity > item.product.stock) {
                alert(`Insufficient stock for ${item.product.name}`);
                return;
            }
        }

        // Create bill request
        const request = {
            customerName: this.customerName,
            customerMobile: this.customerMobile,
            items: calculation.items.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                brand: item.product.brand,
                quantity: item.quantity,
                basePrice: item.basePrice,
                offerDiscount: item.offerDiscount,
                appliedOffer: item.appliedOffer ? item.appliedOffer.name : null,
                gst: item.product.gst,
                gstAmount: item.gstAmount,
                total: item.total
            })),
            subtotal: calculation.subtotal,
            totalOfferDiscount: calculation.totalOfferDiscount,
            totalGST: calculation.totalGST,
            pointsUsed: calculation.pointsUsed,
            pointsDiscount: calculation.pointsDiscount,
            grandTotal: calculation.grandTotal,
            status: 'pending'
        };

        // Check for duplicate requests
        const existingRequests = dataManager.getRequests();
        const isDuplicate = existingRequests.some(r =>
            r.customerName === request.customerName &&
            r.customerMobile === request.customerMobile &&
            r.status === 'pending' &&
            r.grandTotal === request.grandTotal &&
            JSON.stringify(r.items) === JSON.stringify(request.items)
        );

        if (isDuplicate) {
            alert('You have already submitted this request. Please wait for approval.');
            return;
        }

        // OFFLINE MODE CHECK
        if (this.isOffline) {
            this.checkoutViaWhatsApp(request);
            return;
        }

        const requestId = dataManager.addRequest(request);

        // Clear cart but don't deduct points yet (will be done on approval)
        this.clearCart();

        alert('Bill request submitted successfully! You will be notified once approved.');
        this.currentView = 'status';
        this.render();
    }

    // ============================================
    // RENDER METHODS
    // ============================================

    render() {
        // Focus Preservation Mechanism
        const activeElement = document.activeElement;
        const focusedId = activeElement ? activeElement.id : null;
        const cursorStart = (activeElement && activeElement.value) ? activeElement.selectionStart : null;
        const cursorEnd = (activeElement && activeElement.value) ? activeElement.selectionEnd : null;

        const app = document.getElementById('app');

        if (this.currentView === 'login') {
            app.innerHTML = this.renderLogin();
        } else {
            app.innerHTML = `
                ${this.renderHeader()}
                ${this.renderNavigation()}
                ${this.renderContent()}
            `;
        }

        this.attachEventListeners();

        // Restore Focus
        if (focusedId) {
            const el = document.getElementById(focusedId);
            if (el) {
                el.focus();
                if (cursorStart !== null && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
                    try {
                        el.setSelectionRange(cursorStart, cursorEnd);
                    } catch (e) {
                        // Some inputs like type='number' don't support selection range
                    }
                }
            }
        }
    }

    renderLogin() {
        return `
            <div class="customer-container">
                <div style="max-width: 450px; margin: 80px auto; background: white; border: 3px solid black; border-radius: 12px; padding: 40px; box-shadow: 10px 10px 0px rgba(0,0,0,1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 10px;">🔐 Shop Entrance</h1>
                        <p style="color: #666; font-size: 16px;">This is a private, secured store.<br>Please identify yourself to enter.</p>
                    </div>
                    
                    <form id="loginForm" onsubmit="event.preventDefault();">
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 700; color: black; text-transform: uppercase; letter-spacing: 1px;">Your Full Name</label>
                            <input type="text" id="customerName" placeholder="e.g. Rahul Sharma" required 
                                style="width: 100%; padding: 16px; border: 2px solid black; border-radius: 8px; font-size: 18px; font-weight: 600; background: #f8f9fa;">
                        </div>
                        
                        <div style="margin-bottom: 32px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 700; color: black; text-transform: uppercase; letter-spacing: 1px;">Mobile Number</label>
                            <input type="tel" id="customerMobile" placeholder="98765 43210" required pattern="[6-9][0-9]{9}" maxlength="10"
                                style="width: 100%; padding: 16px; border: 2px solid black; border-radius: 8px; font-size: 18px; font-weight: 600; background: #f8f9fa;">
                            <small style="color: #555; font-size: 13px; margin-top: 8px; display: block;">* We use this to save your Orders & Points.</small>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 18px; font-size: 20px; font-weight: 800; text-transform: uppercase;">
                            🔓 Enter Shop
                        </button>

                        <div style="margin-top: 24px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #eee; padding-top: 15px;">
                            Strict Access / No Guest Mode Allowed
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    renderHeader() {
        const shopInfo = dataManager.getShopInfo();

        return `
            <div class="customer-header">
                <div class="shop-info">
                    <h1>🛒 ${shopInfo.name}</h1>
                    <p>${shopInfo.address}</p>
                    <p>📞 ${shopInfo.phone}</p>
                </div>
                <div class="customer-info">
                    <div>
                        <span class="customer-name">👤 ${this.customerName}</span>
                        <span style="color: #1a1a1a; margin-left: 16px;">📱 ${this.customerMobile}</span>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <span class="customer-points">⭐ ${this.points} Points</span>
                        <button onclick="app.handleLogout()" class="btn btn-secondary" style="padding: 8px 16px;">Logout</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderNavigation() {
        const tabs = [
            { id: 'products', label: '🛍️ Products', badge: null },
            { id: 'cart', label: '🛒 Cart', badge: this.cart.length },
            { id: 'wishlist', label: '❤️ Wishlist', badge: this.wishlist.length },
            { id: 'status', label: '📋 My Bills', badge: null }
        ];

        return `
            <div class="nav-tabs">
                ${tabs.map(tab => `
                    <div class="nav-tab ${this.currentView === tab.id ? 'active' : ''}" 
                         onclick="app.currentView = '${tab.id}'; app.render();">
                        ${tab.label}
                        ${tab.badge !== null && tab.badge > 0 ? `<span style="background: #ff1744; color: white; padding: 2px 8px; border-radius: 12px; margin-left: 8px; font-size: 12px; border: 2px solid black;">${tab.badge}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderContent() {
        switch (this.currentView) {
            case 'products':
                return this.renderProducts();
            case 'cart':
                return this.renderCart();
            case 'wishlist':
                return this.renderWishlist();
            case 'status':
                return this.renderBillStatus();
            default:
                return '';
        }
    }

    renderProducts() {
        const products = this.getFilteredProducts();
        const categories = this.getCategories();
        const brands = this.getBrands();

        return `
            <div class="customer-container">
                <div class="search-filter-section">
                    <div class="search-bar">
                        <input type="text" class="search-input" id="searchInput" 
                               placeholder="🔍 Search products by name or brand..." 
                               value="${this.filters.search}">
                    </div>
                    
                    <div class="filters-row">
                        <div class="filter-group">
                            <label>Category</label>
                            <select id="categoryFilter">
                                <option value="all">All Categories</option>
                                ${categories.map(cat => `
                                    <option value="${cat}" ${this.filters.category === cat ? 'selected' : ''}>${cat}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label>Brand</label>
                            <select id="brandFilter">
                                <option value="all">All Brands</option>
                                ${brands.map(brand => `
                                    <option value="${brand}" ${this.filters.brand === brand ? 'selected' : ''}>${brand}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label>Stock</label>
                            <select id="stockFilter">
                                <option value="false" ${!this.filters.stockOnly ? 'selected' : ''}>All Products</option>
                                <option value="true" ${this.filters.stockOnly ? 'selected' : ''}>In Stock Only</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="margin-top: 16px;">
                        <label style="font-weight: 700; color: black; margin-bottom: 8px; display: block;">Sort By</label>
                        <div class="sort-options">
                            ${[
                { id: 'name-asc', label: 'Name A-Z' },
                { id: 'name-desc', label: 'Name Z-A' },
                { id: 'price-asc', label: 'Price Low-High' },
                { id: 'price-desc', label: 'Price High-Low' },
                { id: 'stock', label: 'Stock' }
            ].map(sort => `
                                <button class="sort-btn ${this.sortBy === sort.id ? 'active' : ''}" 
                                        onclick="app.sortBy = '${sort.id}'; app.render();">
                                    ${sort.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="products-grid">
                    ${products.length === 0 ? `
                        <div class="empty-state" style="grid-column: 1 / -1;">
                            <div class="empty-state-icon">📦</div>
                            <div class="empty-state-text">No products found</div>
                        </div>
                    ` : products.map(product => this.renderProductCard(product)).join('')}
                </div>
            </div>
        `;
    }

    renderProductCard(product) {
        const defaultPrice = this.getDefaultPrice(product);
        const cartItem = this.cart.find(item => item.productId === product.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        const isWishlisted = this.isInWishlist(product.id);

        let stockClass = 'in-stock';
        let stockText = `${product.stock} in stock`;

        if (product.stock === 0) {
            stockClass = 'out-of-stock';
            stockText = 'Out of Stock';
        } else if (product.stock <= 5) {
            stockClass = 'low-stock';
            stockText = 'Low Stock';
        } else {
            stockClass = 'in-stock';
            stockText = 'In Stock';
        }

        // Show best offer
        let offerHTML = '';
        if (product.offers && product.offers.length > 0) {
            const bestOffer = product.offers[0];
            offerHTML = `<div class="offer-badge">🎉 ${bestOffer.name}</div>`;
        }

        return `
            <div class="product-card">
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" 
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(product.brand + '+' + product.name)}&background=ffffff&color=000000&size=512&bold=true&format=svg'">
                </div>
                <div class="product-info">
                    <div class="product-brand">${product.brand}</div>
                    <div class="product-name">${product.name}</div>
                    ${offerHTML}
                    <div class="product-price-row">
                        <div class="product-price">₹${Math.round(defaultPrice)}</div>
                        <div class="product-stock ${stockClass}">${stockText}</div>
                    </div>
                    ${product.gst > 0 ? `<div style="font-size: 12px; color: #1a1a1a; margin-top: 4px;">GST: ${product.gst}%</div>` : ''}
                    <div class="product-actions">
                        <div class="quantity-controls">
                            <button class="qty-btn" onclick="app.updateCartQuantity('${product.id}', ${quantity - 1})" 
                                    ${quantity === 0 || product.stock === 0 ? 'disabled' : ''}>−</button>
                            <div class="qty-display">${quantity}</div>
                            <button class="qty-btn" onclick="app.addToCart('${product.id}')" 
                                    ${product.stock === 0 || quantity >= product.stock ? 'disabled' : ''}>+</button>
                        </div>
                        <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" 
                                onclick="app.toggleWishlist('${product.id}')">
                            ${isWishlisted ? '❤️' : '🤍'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderCart() {
        if (this.cart.length === 0) {
            return `
                <div class="customer-container">
                    <div class="empty-state">
                        <div class="empty-state-icon">🛒</div>
                        <div class="empty-state-text">Your cart is empty</div>
                        <button onclick="app.currentView = 'products'; app.render();" class="btn btn-primary" style="margin-top: 24px;">
                            Start Shopping
                        </button>
                    </div>
                </div>
            `;
        }

        const calculation = this.calculateCartTotal();
        const settings = dataManager.getSettings();

        return `
            <div class="customer-container">
                <div class="cart-container">
                    <div class="cart-header">
                        <h2>🛒 Your Cart</h2>
                        <button onclick="app.clearCart()" class="btn btn-danger">Clear Cart</button>
                    </div>

                    <div class="cart-items">
                        ${calculation.items.map(item => `
                            <div class="cart-item">
                                <div class="cart-item-image-container">
                                    <img src="${item.product.image}" alt="${item.product.name}"
                                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.product.brand + '+' + item.product.name)}&background=ffffff&color=000000&size=512&bold=true&format=svg'">
                                </div>
                                <div class="cart-item-details">
                                    <div class="cart-item-name">${item.product.name}</div>
                                    <div class="cart-item-brand">${item.product.brand}</div>
                                    <div style="margin-top: 8px; font-size: 14px; color: #1a1a1a;">
                                        <div>Quantity: ${item.quantity} × ₹${Math.round(item.basePrice)} = ₹${Math.round(item.itemSubtotal)}</div>
                                        ${item.offerDiscount > 0 ? `<div style="color: #00c853; font-weight: 700;">Offer Discount: -₹${Math.round(item.offerDiscount)}</div>` : ''}
                                        ${item.product.gst > 0 ? `<div>GST (${item.product.gst}%): +₹${Math.round(item.gstAmount)}</div>` : ''}
                                    </div>
                                    <div class="cart-item-price">Total: ₹${Math.round(item.total)}</div>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <div class="quantity-controls" style="flex-direction: column;">
                                        <button class="qty-btn" onclick="app.updateCartQuantity('${item.product.id}', ${item.quantity + 1})"
                                                ${item.quantity >= item.product.stock ? 'disabled' : ''}>+</button>
                                        <div class="qty-display">${item.quantity}</div>
                                        <button class="qty-btn" onclick="app.updateCartQuantity('${item.product.id}', ${item.quantity - 1})">−</button>
                                    </div>
                                    <button class="cart-item-remove" onclick="app.removeFromCart('${item.product.id}')">Remove</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="cart-summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span style="font-weight: 700;">₹${Math.round(calculation.subtotal)}</span>
                        </div>
                        ${calculation.totalOfferDiscount > 0 ? `
                            <div class="summary-row" style="color: #00c853;">
                                <span>Offer Discount:</span>
                                <span style="font-weight: 700;">-₹${Math.round(calculation.totalOfferDiscount)}</span>
                            </div>
                        ` : ''}
                        <div class="summary-row">
                            <span>GST:</span>
                            <span style="font-weight: 700;">₹${Math.round(calculation.totalGST)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Total Before Points:</span>
                            <span style="font-weight: 700;">₹${Math.round(calculation.totalBeforePoints)}</span>
                        </div>
                        ${calculation.pointsDiscount > 0 ? `
                            <div class="summary-row" style="color: #ff1744;">
                                <span>Points Discount (${calculation.pointsUsed} pts):</span>
                                <span style="font-weight: 700;">-₹${Math.round(calculation.pointsDiscount)}</span>
                            </div>
                        ` : ''}
                        <div class="summary-row total">
                            <span>Grand Total:</span>
                            <span>₹${Math.round(calculation.grandTotal)}</span>
                        </div>
                    </div>

                    ${this.points > 0 ? `
                        <div class="points-section" onclick="app.togglePointsUsage()" 
                             style="background: ${this.pointsToUse > 0 ? '#e3f2fd' : '#fff'}; border: 2px solid ${this.pointsToUse > 0 ? '#2196f3' : '#e0e0e0'}; padding: 16px; border-radius: 8px; margin-top: 16px; cursor: pointer; transition: all 0.2s;">
                             <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="font-size: 24px;">${this.pointsToUse > 0 ? '✅' : '⬜'}</div>
                                    <div>
                                        <div style="font-weight: 700; color: black; font-size: 16px;">Redeem Points</div>
                                        <div style="font-size: 13px; color: #666;">Available: ${this.points} pts = ₹${this.points * settings.pointsValue}</div>
                                    </div>
                                </div>
                                ${this.pointsToUse > 0 ? `
                                    <div style="font-weight: 700; color: #00c853; font-size: 16px;">
                                        Using ${calculation.pointsUsed} pts (-₹${Math.round(calculation.pointsDiscount)})
                                    </div>
                                ` : ''}
                             </div>
                        </div>
                    ` : ''}

                    <button onclick="app.submitBillRequest()" class="btn btn-success" style="width: 100%; padding: 16px; font-size: 18px; font-weight: 700;">
                        Submit Bill Request
                    </button>
                </div>
            </div>
        `;
    }

    togglePointsUsage() {
        if (this.pointsToUse > 0) {
            this.pointsToUse = 0;
        } else {
            // Set to max available. Calculation logic will clamp it to needed amount.
            this.pointsToUse = this.points;
        }
        this.render();
    }

    renderWishlist() {
        if (this.wishlist.length === 0) {
            return `
                <div class="customer-container">
                    <div class="empty-state">
                        <div class="empty-state-icon">❤️</div>
                        <div class="empty-state-text">Your wishlist is empty</div>
                        <button onclick="app.currentView = 'products'; app.render();" class="btn btn-primary" style="margin-top: 24px;">
                            Browse Products
                        </button>
                    </div>
                </div>
            `;
        }

        const wishlistProducts = this.wishlist.map(id => dataManager.getProductById(id)).filter(p => p);

        return `
            <div class="customer-container">
                <h2 style="font-size: 24px; font-weight: 700; color: black; margin-bottom: 24px;">❤️ Your Wishlist</h2>
                <div class="wishlist-grid">
                    ${wishlistProducts.map(product => {
            const defaultPrice = this.getDefaultPrice(product);
            return `
                            <div class="wishlist-item">
                                <button class="wishlist-remove" onclick="app.toggleWishlist('${product.id}')">×</button>
                                <img src="${product.image}" alt="${product.name}" 
                                     style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid black; margin-bottom: 12px;"
                                     onerror="this.src='https://via.placeholder.com/200x150/ffffff/000000?text=${encodeURIComponent(product.name)}'">
                                <div style="font-weight: 700; color: black; margin-bottom: 4px;">${product.name}</div>
                                <div style="font-size: 12px; color: #1a1a1a; margin-bottom: 8px;">${product.brand}</div>
                                <div style="font-size: 18px; font-weight: 700; color: black; margin-bottom: 12px;">₹${Math.round(defaultPrice)}</div>
                                <button onclick="app.addToCart('${product.id}'); app.currentView = 'cart'; app.render();" 
                                        class="btn btn-primary" style="width: 100%; padding: 10px; font-size: 14px;"
                                        ${product.stock === 0 ? 'disabled' : ''}>
                                    ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    renderBillStatus() {
        const allRequests = dataManager.getRequests();
        const myRequests = allRequests.filter(r =>
            dataManager.getCustomerIdentity(r.customerName, r.customerMobile) ===
            dataManager.getCustomerIdentity(this.customerName, this.customerMobile)
        );

        const allBills = dataManager.getBills();
        const myBills = allBills.filter(b =>
            dataManager.getCustomerIdentity(b.customerName, b.customerMobile) ===
            dataManager.getCustomerIdentity(this.customerName, this.customerMobile)
        );

        // Use a map to track unique requests by ID
        const uniqueRequestsMap = new Map();
        myRequests.forEach(req => uniqueRequestsMap.set(req.id, req));
        const uniqueRequests = Array.from(uniqueRequestsMap.values());

        return `
            <div class="customer-container">
                <h2 style="font-size: 24px; font-weight: 700; color: black; margin-bottom: 24px;">📋 My Bills & Requests</h2>
                
                ${uniqueRequests.length === 0 && myBills.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-text">No bills or requests yet</div>
                        <button onclick="app.currentView = 'products'; app.render();" class="btn btn-primary" style="margin-top: 24px;">
                            Start Shopping
                        </button>
                    </div>
                ` : `
                    <div class="bill-requests-list">
                        ${uniqueRequests.map(request => `
                            <div class="bill-request-card">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                    <div>
                                        <div style="font-weight: 700; color: black; font-size: 18px;">Request #${request.id}</div>
                                        <div style="font-size: 12px; color: #1a1a1a; margin-top: 4px;">
                                            ${new Date(request.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <div class="bill-status ${request.status}">
                                        ${request.status === 'pending' ? '⏳ Pending' :
                request.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                                    </div>
                                </div>
                                
                                <div class="bill-details">
                                    <div style="font-weight: 700; color: black; margin-bottom: 8px;">Items:</div>
                                    ${request.items.map(item => `
                                        <div style="padding: 8px; background: white; border: 2px solid black; border-radius: 8px; margin-bottom: 8px;">
                                            <div style="font-weight: 700; color: black;">${item.productName}</div>
                                            <div style="font-size: 14px; color: #1a1a1a;">
                                                ${item.quantity} × ₹${Math.round(item.basePrice)} = ₹${Math.round(item.quantity * item.basePrice)}
                                            </div>
                                            ${item.offerDiscount > 0 ? `<div style="color: #00c853; font-size: 12px;">Offer: -₹${Math.round(item.offerDiscount)}</div>` : ''}
                                            ${item.gstAmount > 0 ? `<div style="font-size: 12px; color: #1a1a1a;">GST: +₹${Math.round(item.gstAmount)}</div>` : ''}
                                        </div>
                                    `).join('')}
                                    
                                    <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid black;">
                                        <div class="bill-detail-row">
                                            <span>Subtotal:</span>
                                            <span style="font-weight: 700;">₹${Math.round(request.subtotal)}</span>
                                        </div>
                                        ${request.totalOfferDiscount > 0 ? `
                                            <div class="bill-detail-row" style="color: #00c853;">
                                                <span>Offer Discount:</span>
                                                <span style="font-weight: 700;">-₹${Math.round(request.totalOfferDiscount)}</span>
                                            </div>
                                        ` : ''}
                                        <div class="bill-detail-row">
                                            <span>GST:</span>
                                            <span style="font-weight: 700;">₹${Math.round(request.totalGST)}</span>
                                        </div>
                                        ${request.pointsDiscount > 0 ? `
                                            <div class="bill-detail-row" style="color: #ff1744;">
                                                <span>Points Used (${request.pointsUsed} pts):</span>
                                                <span style="font-weight: 700;">-₹${Math.round(request.pointsDiscount)}</span>
                                            </div>
                                        ` : ''}
                                        <div class="bill-detail-row" style="font-size: 18px; font-weight: 700; margin-top: 8px;">
                                            <span>Grand Total:</span>
                                            <span>₹${Math.round(request.grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                        
                        ${myBills.map(bill => `
                            <div class="bill-request-card" style="border-color: #00c853;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                    <div>
                                        <div style="font-weight: 700; color: black; font-size: 18px;">Bill #${bill.billNumber}</div>
                                        <div style="font-size: 12px; color: #1a1a1a; margin-top: 4px;">
                                            ${new Date(bill.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <div class="bill-status approved">✅ Completed</div>
                                </div>
                                
                                <div class="bill-details">
                                    <div style="font-weight: 700; color: black; margin-bottom: 8px;">Items:</div>
                                    ${bill.items.map(item => `
                                        <div style="padding: 8px; background: white; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 8px;">
                                            <div style="font-weight: 700; color: black;">${item.productName}</div>
                                            <div style="font-size: 14px; color: #1a1a1a;">
                                                ${item.quantity} × ₹${Math.round(item.basePrice)} = ₹${Math.round(item.total)}
                                            </div>
                                            ${item.offerDiscount > 0 ? `<div style="color: #00c853; font-size: 12px;">Offer: -₹${Math.round(item.offerDiscount)}</div>` : ''}
                                        </div>
                                    `).join('')}

                                    <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid black;">
                                        <div class="bill-detail-row">
                                            <span>Subtotal:</span>
                                            <span style="font-weight: 700;">₹${Math.round(bill.subtotal)}</span>
                                        </div>
                                        ${bill.totalOfferDiscount > 0 ? `
                                            <div class="bill-detail-row" style="color: #00c853;">
                                                <span>Offer Discount:</span>
                                                <span style="font-weight: 700;">-₹${Math.round(bill.totalOfferDiscount)}</span>
                                            </div>
                                        ` : ''}
                                        <div class="bill-detail-row">
                                            <span>GST:</span>
                                            <span style="font-weight: 700;">₹${Math.round(bill.totalGST)}</span>
                                        </div>
                                        ${bill.pointsDiscount > 0 ? `
                                            <div class="bill-detail-row" style="color: #ff1744;">
                                                <span>Points Used (${bill.pointsUsed} pts):</span>
                                                <span style="font-weight: 700;">-₹${Math.round(bill.pointsDiscount)}</span>
                                            </div>
                                        ` : ''}
                                        <div class="bill-detail-row" style="font-size: 18px; font-weight: 700; margin-top: 8px;">
                                            <span>Grand Total:</span>
                                            <span>₹${Math.round(bill.grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                ${bill.pointsEarned > 0 ? `
                                    <div style="margin-top: 12px; padding: 12px; background: #ffc107; border: 2px solid black; border-radius: 8px; text-align: center; font-weight: 700; color: black;">
                                        ⭐ You earned ${bill.pointsEarned} points!
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }

    attachEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('customerName').value;
                const mobile = document.getElementById('customerMobile').value;
                this.handleLogin(name, mobile);
            });
        }

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.render();
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.render();
            }

    // ============================================
    // OFFLINE HELPER METHODS
    // ============================================

    async loadStaticMenu() {
                try {
                    console.log('📦 Loading Static Menu...');
                    const response = await fetch('products.json');
                    if(response.ok) {
                const products = await response.json();
                this.allProducts = products; // Override with static data
                this.render(); // Re-render with new data
                console.log('✅ Loaded Static Menu (Offline Mode):', products.length, 'items');
            } else {
                console.error('❌ products.json not found');
            }
        } catch (e) {
            console.error('Failed to load static menu:', e);
        }
    }

    checkoutViaWhatsApp(request) {
        // REPLACE WITH YOUR ACTUAL NUMBER
        const phones = ["919876543210"];
        const phone = phones[0];

        let text = `*New Order Request* (Offline Mode)\n`;
        text += `Customer: ${request.customerName || 'Guest'}\n`;
        text += `Mobile: ${request.customerMobile || 'N/A'}\n\n`;
        text += `*Items:*\n`;

        request.items.forEach(item => {
            text += `- ${item.productName} (${item.quantity} x ₹${item.basePrice}) = ₹${item.total}\n`;
        });

        text += `\n*Total Estimate: ₹${request.grandTotal}*`;
        text += `\n(Sent from GitHub Offline Shop)`;

        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');

        this.clearCart();
        // Force reload to clear state cleanly
        setTimeout(() => window.location.reload(), 1000);
    }
});
        }

// Brand filter
const brandFilter = document.getElementById('brandFilter');
if (brandFilter) {
    brandFilter.addEventListener('change', (e) => {
        this.filters.brand = e.target.value;
        this.render();
    });
}

// Stock filter
const stockFilter = document.getElementById('stockFilter');
if (stockFilter) {
    stockFilter.addEventListener('change', (e) => {
        this.filters.stockOnly = e.target.value === 'true';
        this.render();
    });
}
    }
}

// Initialize app
const app = new CustomerApp();
