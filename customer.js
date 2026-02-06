/**
 * CUSTOMER PLATFORM - V5.1 FIXED
 * All bugs fixed: wishlist UI, navigation, points toggle, order rendering
 */

class CustomerApp {
    constructor() {
        this.currentView = 'login';
        this.customerName = '';
        this.customerMobile = '';
        this.cart = [];
        this.wishlist = [];
        this.points = 0;
        this.snapshot = null;
        this.isOnline = false;
        this.backendUrl = '';
        this.pointsRedeemEnabled = false;
        this.pendingBills = [];
        this.approvedBills = [];

        this.filters = {
            search: '',
            category: 'all'
        };

        this.init();
    }

    async init() {
        console.log('🚀 Initializing Customer Platform V5.1...');

        // 1. Restore session
        const saved = sessionStorage.getItem('customer');
        if (saved) {
            try {
                const { name, mobile } = JSON.parse(saved);
                this.customerName = name;
                this.customerMobile = mobile;
                this.currentView = 'products';
            } catch (e) { sessionStorage.removeItem('customer'); }
        }

        // 2. Load snapshot
        await this.loadSnapshot();

        // 3. Check backend availability
        await this.checkBackendStatus();

        // 4. If online and logged in, sync with backend
        if (this.isOnline && this.customerMobile) {
            await this.syncWithBackend();
        }

        // 5. Initial render
        this.render();

        // 6. Periodic backend check (every 10 seconds)
        setInterval(() => this.checkBackendStatus(), 10000);
    }

    async loadSnapshot() {
        try {
            const res = await fetch('products.json?t=' + Date.now());
            if (res.ok) {
                this.snapshot = await res.json();
                console.log('✅ Snapshot loaded:', this.snapshot.products?.length || 0, 'products');
            }
        } catch (e) {
            console.error('❌ Failed to load snapshot:', e);
        }
    }

    async checkBackendStatus() {
        // ✅ FIXED: Proper backend URL detection
        const backendHint = this.snapshot?.backendAvailabilityHint;

        if (!backendHint) {
            this.isOnline = false;
            console.log('🔴 Offline Mode: No backend URL');
            return;
        }

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);

            const res = await fetch(backendHint + '/api/health', {
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeout);
            const wasOnline = this.isOnline;
            this.isOnline = res.ok;

            if (this.isOnline) {
                this.backendUrl = backendHint;
                console.log('🟢 Online Mode:', this.backendUrl);

                // If just came online and logged in, sync
                if (!wasOnline && this.customerMobile) {
                    await this.syncWithBackend();
                }

                // Periodic Sync if online (Orders & Data)
                if (this.isOnline && this.customerMobile) {
                    this.loadOrderStatus(); // Refresh order status
                    if (Date.now() % 30000 < 2000) this.loadRealtimeData(); // Sync offers every 30s
                }
            } else {
                console.log('🔴 Offline Mode: Backend not responding');
            }
        } catch (e) {
            this.isOnline = false;
            console.log('🔴 Offline Mode:', e.message);
        }
    }

    async syncWithBackend() {
        if (!this.isOnline || !this.customerMobile) return;

        try {
            // Login/sync customer data
            const res = await fetch(this.backendUrl + '/api/customer/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile: this.customerMobile,
                    name: this.customerName
                })
            });

            if (res.ok) {
                const data = await res.json();
                this.points = data.customer.points || 0;
                this.wishlist = data.customer.wishlist || [];
                console.log('✅ Synced with backend:', this.points, 'points');

                // Load fresh products and offers from backend (Real-time updates)
                await this.loadRealtimeData();

                // Load order status
                await this.loadOrderStatus();
            }
        } catch (e) {
            console.error('❌ Backend sync failed:', e);
        }
    }

    async loadRealtimeData() {
        if (!this.isOnline) return;
        try {
            // Fetch public data (products/offers) from backend
            const res = await fetch(this.backendUrl + '/api/data');
            if (res.ok) {
                const data = await res.json();
                if (data.products) this.snapshot.products = data.products;
                if (data.offers) this.snapshot.offers = data.offers;
                if (data.settings) {
                    this.snapshot.settings = { ...this.snapshot.settings, ...data.settings };
                }
                console.log('🔄 Real-time data updated');
                // Only re-render if viewing products/cart to show new prices
                if (['products', 'cart'].includes(this.currentView)) {
                    this.render();
                }
            }
        } catch (e) {
            console.warn('⚠️ Real-time data fetch failed, using snapshot', e);
        }
    }

    async loadOrderStatus() {
        if (!this.isOnline || !this.customerMobile) return;

        try {
            const res = await fetch(this.backendUrl + '/api/customer/status/' + this.customerMobile);
            if (res.ok) {
                const data = await res.json();
                this.pendingBills = data.pendingBills || [];
                this.approvedBills = data.approvedBills || [];
                console.log('✅ Loaded orders:', this.pendingBills.length, 'pending,', this.approvedBills.length, 'approved');
            }
        } catch (e) {
            console.error('❌ Failed to load orders:', e);
        }
    }

    // ==================== USER ACTIONS ====================

    async handleLogin(e) {
        e.preventDefault();
        const mobile = document.getElementById('mobileInput').value.trim();
        const name = document.getElementById('nameInput').value.trim();

        if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }

        if (!name) {
            alert('Please enter your name');
            return;
        }

        this.customerMobile = mobile;
        this.customerName = name;
        sessionStorage.setItem('customer', JSON.stringify({ mobile, name }));

        // Sync with backend if online
        if (this.isOnline) {
            await this.syncWithBackend();
        }

        this.currentView = 'products';
        this.render();
    }

    logout() {
        sessionStorage.removeItem('customer');
        this.customerMobile = '';
        this.customerName = '';
        this.cart = [];
        this.wishlist = [];
        this.points = 0;
        this.currentView = 'login';
        this.render();
    }

    addToCart(productId) {
        const product = this.snapshot?.products?.find(p => p.id === productId);
        if (!product || product.stock <= 0) return;

        // Add to cart with quantity 1
        this.cart.push({ productId, quantity: 1 });

        // ✅ CRITICAL FIX: Cart resets to allow creating multiple orders
        // Quantity shown is CURRENT cart quantity, not persistent selection

        this.render();
    }

    updateCartQuantity(productId, newQty) {
        const product = this.snapshot?.products?.find(p => p.id === productId);
        if (!product) return;

        const maxQty = product.stock || 0;
        const validQty = Math.max(0, Math.min(newQty, maxQty));

        if (validQty === 0) {
            this.cart = this.cart.filter(item => item.productId !== productId);
        } else {
            const item = this.cart.find(item => item.productId === productId);
            if (item) {
                item.quantity = validQty;
            }
        }

        this.render();
    }

    async toggleWishlist(productId) {
        const isInWishlist = this.wishlist.includes(productId);

        if (this.isOnline && this.customerMobile) {
            // Online mode: sync with backend
            try {
                const endpoint = isInWishlist ? '/api/customer/wishlist/remove' : '/api/customer/wishlist/add';
                const res = await fetch(this.backendUrl + endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mobile: this.customerMobile,
                        productId
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    this.wishlist = data.wishlist;
                    this.render();
                }
            } catch (e) {
                console.error('❌ Wishlist sync failed:', e);
            }
        } else {
            // Offline mode: local only
            if (isInWishlist) {
                this.wishlist = this.wishlist.filter(id => id !== productId);
            } else {
                this.wishlist.push(productId);
            }
            this.render();
        }
    }

    togglePointsRedemption() {
        this.pointsRedeemEnabled = !this.pointsRedeemEnabled;
        this.render();
    }

    async requestBill() {
        if (this.cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        if (this.isOnline) {
            // Online mode: send to backend
            try {
                const res = await fetch(this.backendUrl + '/api/customer/request-bill', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mobile: this.customerMobile,
                        name: this.customerName,
                        items: this.cart.map(i => ({ productId: i.productId, quantity: parseInt(i.quantity) })),
                        pointsRedeemEnabled: this.pointsRedeemEnabled
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    alert(`✅ Bill request sent!\n\nRequest ID: ${data.requestId}\nTotal: ₹${data.total.toFixed(2)}\n\nStatus: Pending approval\n\nCheck "My Orders" to track your request.`);
                    this.cart = [];
                    this.pointsRedeemEnabled = false;
                    await this.loadOrderStatus();
                    this.currentView = 'orders';
                    this.render();
                } else {
                    const error = await res.json();
                    alert('❌ Failed to send request: ' + (error.error || 'Unknown error'));
                }
            } catch (e) {
                console.error('❌ Request failed:', e);
                alert('❌ Failed to send request. Please try again.');
            }
        } else {
            // Offline mode: WhatsApp fallback
            this.sendWhatsAppOrder();
        }
    }

    sendWhatsAppOrder() {
        const products = this.snapshot?.products || [];
        const cartItems = this.cart.map(item => {
            const product = products.find(p => p.id === item.productId);
            return { ...item, product };
        }).filter(item => item.product);

        if (cartItems.length === 0) {
            alert('No valid items in cart');
            return;
        }

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const { discount, discountDetails } = this.calculateDiscount(cartItems, subtotal);
        const gstRate = this.snapshot?.settings?.gstRate || 18;
        const gst = ((subtotal - discount) * gstRate) / 100;
        const total = subtotal - discount + gst;

        // Build message
        let message = `🛒 *New Order Request*\n\n`;
        message += `👤 Customer: ${this.customerName}\n`;
        message += `📱 Mobile: ${this.customerMobile}\n\n`;
        message += `📦 *Items:*\n`;

        cartItems.forEach((item, idx) => {
            message += `${idx + 1}. ${item.product.name}\n`;
            message += `   ₹${item.product.price} × ${item.quantity} = ₹${(item.product.price * item.quantity).toFixed(2)}\n`;
        });

        message += `\n💰 *Bill Summary:*\n`;
        message += `Subtotal: ₹${subtotal.toFixed(2)}\n`;
        if (discount > 0) {
            message += `Discount ${discountDetails}: -₹${discount.toFixed(2)}\n`;
        }
        message += `GST (${gstRate}%): ₹${gst.toFixed(2)}\n`;
        message += `*Total: ₹${total.toFixed(2)}*\n\n`;
        message += `📍 Mode: Offline (WhatsApp Order)`;

        const phone = this.snapshot?.shop?.phone || this.snapshot?.settings?.phone || '';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    }

    calculateDiscount(cartItems, subtotal) {
        const offers = this.snapshot?.offers || [];
        let discount = 0;
        let discountDetails = '';

        for (const offer of offers) {
            // Check validity
            if (offer.validUntil && new Date(offer.validUntil) < new Date()) continue;

            let applicable = false;

            if (offer.type === 'quantity') {
                const totalQty = cartItems.reduce((sum, item) => {
                    const applicableIds = offer.applicableProducts || offer.productIds;
                    if (!applicableIds || applicableIds.length === 0 ||
                        applicableIds.includes(item.productId)) {
                        return sum + item.quantity;
                    }
                    return sum;
                }, 0);
                applicable = totalQty >= (offer.condition?.minQty || 0);
            } else if (offer.type === 'price') {
                applicable = subtotal >= (offer.condition?.minAmount || 0);
            }

            if (applicable) {
                let offerDiscount = 0;
                if (offer.discountType === 'percentage') {
                    offerDiscount = (subtotal * offer.discount) / 100;
                } else {
                    offerDiscount = offer.discount;
                }
                discount += offerDiscount;
                discountDetails = offer.label || `${offer.discount}% OFF`;
            }
        }

        return { discount, discountDetails };
    }

    // ==================== RENDERING ====================

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
                        <h1>${this.snapshot?.shop?.name || 'Jain Ayurvedic'} <span class="highlight">Shop</span></h1>
                        <p>Welcome! Please login to continue.</p>
                    </div>
                    <form id="loginForm" class="login-form">
                        <div class="form-group">
                            <label>📱 Mobile Number</label>
                            <input type="tel" id="mobileInput" placeholder="10-digit mobile" maxlength="10" required>
                        </div>
                        <div class="form-group">
                            <label>👤 Your Name</label>
                            <input type="text" id="nameInput" placeholder="Enter your name" required>
                        </div>
                        <button type="submit" class="btn-primary">Continue Shopping →</button>
                    </form>
                </div>
            </div>
        `;
    }

    renderHeader() {
        const mode = this.isOnline ? '🟢 Online' : '🔴 Offline';
        const pendingCount = this.pendingBills.length;
        const orderBadge = pendingCount > 0 ? ` (${pendingCount})` : '';

        return `
            <div class="customer-header">
                <div class="header-left">
                    <h2>${this.snapshot?.shop?.name || 'Shop'}</h2>
                    <span class="mode-badge">${mode}</span>
                </div>
                <div class="header-right">
                    ${this.isOnline ? `<span class="points-badge">⭐ ${this.points} Points</span>` : ''}
                    <button onclick="customerApp.currentView='products'; customerApp.render();" class="btn-nav">
                        🏠 Products
                    </button>
                    ${this.isOnline ? `
                        <button onclick="customerApp.currentView='wishlist'; customerApp.render();" class="btn-nav">
                            ❤️ Wishlist (${this.wishlist.length})
                        </button>
                        <button onclick="customerApp.currentView='orders'; customerApp.render();" class="btn-orders">
                            📋 Orders${orderBadge}
                        </button>
                    ` : ''}
                    <span class="cart-badge" onclick="customerApp.currentView='cart'; customerApp.render();">
                        🛒 Cart (${this.cart.length})
                    </span>
                    <button onclick="customerApp.logout()" class="btn-logout">Logout</button>
                </div>
            </div>
        `;
    }

    renderContent() {
        if (this.currentView === 'products') return this.renderProducts();
        if (this.currentView === 'wishlist') return this.renderWishlist();
        if (this.currentView === 'cart') return this.renderCart();
        if (this.currentView === 'orders') return this.renderOrders();
        return '<p>Unknown view</p>';
    }

    renderProducts() {
        const products = this.snapshot?.products || [];
        const filtered = products.filter(p => {
            const matchesSearch = !this.filters.search ||
                p.name.toLowerCase().includes(this.filters.search.toLowerCase());
            const matchesCategory = this.filters.category === 'all' ||
                p.category === this.filters.category;
            return matchesSearch && matchesCategory;
        });

        const categories = ['all', ...new Set(products.map(p => p.category))];

        return `
            <div class="customer-container">
                <div class="filters">
                    <input type="text" placeholder="🔍 Search products..." 
                           value="${this.filters.search}"
                           oninput="customerApp.filters.search = this.value; customerApp.render();">
                    <select onchange="customerApp.filters.category = this.value; customerApp.render();">
                        ${categories.map(cat => `
                            <option value="${cat}" ${this.filters.category === cat ? 'selected' : ''}>
                                ${cat === 'all' ? 'All Categories' : cat}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="product-grid">
                    ${filtered.map(p => this.renderProductCard(p)).join('')}
                </div>
            </div>
        `;
    }

    renderProductCard(product) {
        const inCart = this.cart.find(item => item.productId === product.id);
        const cartQty = inCart ? inCart.quantity : 0;
        const stock = product.stock || 0; // Internal use only
        const inWishlist = this.wishlist.includes(product.id);
        const wishlistIcon = inWishlist ? '❤️' : '🤍';

        // Calculate offer discount
        const offers = this.snapshot?.offers || [];
        const applicableOffer = offers.find(o =>
            !o.applicableProducts || o.applicableProducts.length === 0 ||
            o.applicableProducts.includes(product.id)
        );

        const finalPrice = applicableOffer
            ? Math.round(product.price - (product.price * (applicableOffer.discount || 0) / 100))
            : product.price;

        return `
            <div class="product-card">
                ${this.isOnline ? `<button class="wishlist-btn" onclick="customerApp.toggleWishlist('${product.id}')">${wishlistIcon}</button>` : ''}
                ${applicableOffer ? `<div class="offer-badge">${applicableOffer.discount}% OFF</div>` : ''}
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/200'">
                <h3>${product.name}</h3>
                ${applicableOffer ? `
                    <p class="price-original" style="text-decoration: line-through; color: #999; font-size: 14px;">₹${product.price}</p>
                    <p class="price" style="color: #4CAF50; font-weight: 700;">₹${finalPrice}</p>
                ` : `
                    <p class="price">₹${product.price}</p>
                `}
                <p class="stock-info">${stock > 0 ? 'In Stock ✓' : 'Out of Stock ✗'}</p>
                ${stock > 0 ? `
                    ${cartQty > 0 ? `
                        <div class="quantity-controls">
                            <button onclick="customerApp.updateCartQuantity('${product.id}', ${cartQty - 1})">−</button>
                            <span>${cartQty}</span>
                            <button onclick="customerApp.updateCartQuantity('${product.id}', ${cartQty + 1})" ${cartQty >= stock ? 'disabled' : ''}>+</button>
                        </div>
                        ${cartQty >= stock ? '<small class="stock-warning">Max stock reached</small>' : ''}
                    ` : `
                        <button class="btn-add-cart" onclick="customerApp.addToCart('${product.id}')">Add to Cart</button>
                    `}
                ` : '<button class="btn-disabled" disabled>Out of Stock</button>'}
            </div>
        `;
    }

    renderWishlist() {
        if (!this.isOnline) {
            return `
                <div class="customer-container">
                    <h2>❤️ My Wishlist</h2>
                    <div class="empty-state">
                        <p>⚠️ Wishlist requires online mode</p>
                        <button onclick="customerApp.currentView='products'; customerApp.render();" class="btn-primary">
                            Browse Products
                        </button>
                    </div>
                </div>
            `;
        }

        const products = this.snapshot?.products || [];
        const wishlistProducts = products.filter(p => this.wishlist.includes(p.id));

        if (wishlistProducts.length === 0) {
            return `
                <div class="customer-container">
                    <h2>❤️ My Wishlist</h2>
                    <div class="empty-state">
                        <p>Your wishlist is empty</p>
                        <button onclick="customerApp.currentView='products'; customerApp.render();" class="btn-primary">
                            Browse Products
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="customer-container">
                <h2>❤️ My Wishlist (${wishlistProducts.length})</h2>
                <div class="product-grid">
                    ${wishlistProducts.map(p => this.renderProductCard(p)).join('')}
                </div>
            </div>
        `;
    }

    renderCart() {
        if (this.cart.length === 0) {
            return `
                <div class="customer-container">
                    <h2>🛒 Your Cart</h2>
                    <div class="empty-state">
                        <p>Your cart is empty</p>
                        <button onclick="customerApp.currentView='products'; customerApp.render();" class="btn-primary">
                            Browse Products
                        </button>
                    </div>
                </div>
            `;
        }

        const products = this.snapshot?.products || [];
        const cartItems = this.cart.map(item => {
            const product = products.find(p => p.id === item.productId);
            return { ...item, product };
        }).filter(item => item.product);

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const { discount, discountDetails } = this.calculateDiscount(cartItems, subtotal);
        const gstRate = this.snapshot?.settings?.gstRate || 18;
        const gst = ((subtotal - discount) * gstRate) / 100;

        // Calculate points discount - ONLY if customer has points
        let pointsDiscount = 0;
        const hasPoints = this.points > 0;
        if (this.pointsRedeemEnabled && this.isOnline && hasPoints) {
            const pointsRatio = this.snapshot?.settings?.pointsRatio || 100;
            pointsDiscount = Math.floor(this.points / pointsRatio);
        }

        const total = subtotal - discount + gst - pointsDiscount;

        return `
            <div class="customer-container">
                <h2>🛒 Your Cart</h2>
                <div class="cart-items">
                    ${cartItems.map(item => this.renderCartItem(item)).join('')}
                </div>
                <div class="cart-summary">
                    <h3>Order Summary</h3>
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>₹${subtotal.toFixed(2)}</span>
                    </div>
                    ${discount > 0 ? `
                        <div class="summary-row discount">
                            <span>Discount (${discountDetails}):</span>
                            <span>-₹${discount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="summary-row">
                        <span>GST (${gstRate}%):</span>
                        <span>₹${gst.toFixed(2)}</span>
                    </div>
                    ${this.isOnline && hasPoints ? `
                        <div class="points-redemption">
                            <label>
                                <input type="checkbox" ${this.pointsRedeemEnabled ? 'checked' : ''} 
                                       onchange="customerApp.togglePointsRedemption()">
                                Use ${this.points} points (₹${(this.points / (this.snapshot?.settings?.pointsRatio || 100)).toFixed(2)} off)
                            </label>
                        </div>
                        ${pointsDiscount > 0 ? `
                            <div class="summary-row discount">
                                <span>Points Discount:</span>
                                <span>-₹${pointsDiscount.toFixed(2)}</span>
                            </div>
                        ` : ''}
                    ` : ''}
                    <div class="summary-row total">
                        <span>Total:</span>
                        <span>₹${total.toFixed(2)}</span>
                    </div>
                    <button onclick="customerApp.requestBill()" class="btn-primary btn-checkout">
                        ${this.isOnline ? '✅ Request Bill' : '📱 Send via WhatsApp'}
                    </button>
                </div>
            </div>
        `;
    }

    renderCartItem(item) {
        return `
            <div class="cart-item">
                <img src="${item.product.image}" alt="${item.product.name}">
                <div class="cart-item-details">
                    <h4>${item.product.name}</h4>
                    <p class="price">₹${item.product.price} × ${item.quantity}</p>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button onclick="customerApp.updateCartQuantity('${item.productId}', ${item.quantity - 1})">−</button>
                        <span>${item.quantity}</span>
                        <button onclick="customerApp.updateCartQuantity('${item.productId}', ${item.quantity + 1})" 
                                ${item.quantity >= item.product.stock ? 'disabled' : ''}>+</button>
                    </div>
                    <p class="item-total">₹${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
            </div>
        `;
    }

    renderOrders() {
        if (!this.isOnline) {
            return `
                <div class="customer-container">
                    <h2>📋 My Orders</h2>
                    <div class="empty-state">
                        <p>⚠️ Order tracking requires online mode</p>
                        <p>Please connect to the internet to view your orders</p>
                        <button onclick="customerApp.currentView='products'; customerApp.render();" class="btn-primary">
                            Browse Products
                        </button>
                    </div>
                </div>
            `;
        }

        const hasPending = this.pendingBills.length > 0;
        const hasApproved = this.approvedBills.length > 0;

        if (!hasPending && !hasApproved) {
            return `
                <div class="customer-container">
                    <h2>📋 My Orders</h2>
                    <div class="empty-state">
                        <p>No orders yet</p>
                        <button onclick="customerApp.currentView='products'; customerApp.render();" class="btn-primary">
                            Start Shopping
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="customer-container">
                <h2>📋 My Orders</h2>
                
                ${hasPending ? `
                    <div class="orders-section">
                        <h3>⏳ Pending Bills (${this.pendingBills.length})</h3>
                        ${this.pendingBills.map(bill => this.renderPendingBill(bill)).join('')}
                    </div>
                ` : ''}

                ${hasApproved ? `
                    <div class="orders-section">
                        <h3>✅ Approved Bills (${this.approvedBills.length})</h3>
                        ${this.approvedBills.map(bill => this.renderApprovedBill(bill)).join('')}
                    </div>
                ` : ''}

                <button onclick="customerApp.currentView='products'; customerApp.render();" class="btn-primary">
                    Continue Shopping
                </button>
            </div>
        `;
    }

    renderPendingBill(bill) {
        const date = new Date(bill.createdAt).toLocaleString();
        const total = bill.total || 0;
        const pointsUsed = bill.pointsUsed || 0;

        return `
            <div class="order-card pending">
                <div class="order-header">
                    <span class="order-id">Request ID: ${bill.requestId}</span>
                    <span class="order-status pending">⏳ Pending</span>
                </div>
                <div class="order-details">
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Items:</strong> ${bill.items?.length || 0} products</p>
                    <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
                    ${pointsUsed > 0 ? `<p><strong>Points Used:</strong> ${pointsUsed}</p>` : ''}
                </div>
                <div class="order-items">
                    ${(bill.items || []).map(item => `
                        <div class="order-item">
                            <span>${item.name} × ${item.quantity}</span>
                            <span>₹${(item.total || 0).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderApprovedBill(bill) {
        const date = new Date(bill.approvedAt || bill.createdAt).toLocaleString();
        const total = bill.total || 0;

        return `
            <div class="order-card approved">
                <div class="order-header">
                    <span class="order-id">Bill #${bill.billNumber}</span>
                    <span class="order-status approved">✅ Approved</span>
                </div>
                <div class="order-details">
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Items:</strong> ${bill.items?.length || 0} products</p>
                    <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
                </div>
                <div class="order-items">
                    ${(bill.items || []).map(item => `
                        <div class="order-item">
                            <span>${item.name} × ${item.quantity}</span>
                            <span>₹${(item.total || 0).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    attachEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }
}

// Initialize app
let customerApp;
document.addEventListener('DOMContentLoaded', () => {
    customerApp = new CustomerApp();
});
