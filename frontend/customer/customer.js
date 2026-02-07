// ============================================
// CUSTOMER PLATFORM - MAIN APPLICATION
// ============================================

class CustomerApp {
    constructor() {
        this.currentView = 'login';
        this.customerData = null;
        this.cart = [];
        this.init();
    }

    init() {
        dataManager.addListener((type) => {
            this.render();
        });
        this.loadSession();
        this.render();
    }

    loadSession() {
        const sessionData = sessionStorage.getItem('kirana_customer_session');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            this.customerData = session;
            this.currentView = 'products';
        }
    }

    saveSession() {
        if (this.customerData) {
            sessionStorage.setItem('kirana_customer_session', JSON.stringify(this.customerData));
        }
    }

    login(name, mobile) {
        if (!name || !mobile) {
            alert('Please enter both name and mobile number');
            return;
        }

        this.customerData = dataManager.getCustomerData(name, mobile);
        this.saveSession();
        this.currentView = 'products';
        this.render();
    }

    logout() {
        sessionStorage.removeItem('kirana_customer_session');
        this.customerData = null;
        this.cart = [];
        this.currentView = 'login';
        this.render();
    }

    render() {
        const app = document.getElementById('app');
        if (!app) return;

        if (!this.customerData) {
            app.innerHTML = this.renderLogin();
            return;
        }

        app.innerHTML = `
            <div id="customer-shell">
                <div id="customer-header">${this.renderHeader()}</div>
                <div id="customer-nav">${this.renderNavigation()}</div>
                <div id="customer-content">${this.renderContent()}</div>
            </div>
        `;
        this.attachEventListeners();
    }

    renderHeader() {
        const shopInfo = dataManager.getShopInfo();
        return `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-bottom: 4px solid #000;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🛒 ${shopInfo.name}</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Welcome, ${this.customerData.name}</p>
            </div>
        `;
    }

    renderNavigation() {
        const tabs = [
            { id: 'products', label: '🛍️ Shop', badge: null },
            { id: 'cart', label: '🛒 Cart', badge: this.cart.length },
            { id: 'orders', label: '📦 My Orders', badge: null },
            { id: 'account', label: '👤 Account', badge: null }
        ];

        return `
            <div style="display: flex; background: white; border-bottom: 3px solid #000; overflow-x: auto;">
                ${tabs.map(tab => `
                    <div onclick="customerApp.currentView = '${tab.id}'; customerApp.render();" 
                         style="padding: 15px 25px; cursor: pointer; font-weight: 600; border-bottom: 3px solid ${this.currentView === tab.id ? '#667eea' : 'transparent'}; color: ${this.currentView === tab.id ? '#667eea' : '#666'}; white-space: nowrap; transition: all 0.3s;">
                        ${tab.label}
                        ${tab.badge ? `<span style="background: #ff1744; color: white; padding: 2px 8px; border-radius: 12px; margin-left: 8px; font-size: 12px;">${tab.badge}</span>` : ''}
                    </div>
                `).join('')}
                <div style="margin-left: auto; padding: 15px 25px;">
                    <button onclick="customerApp.logout()" style="background: #ff1744; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">Logout</button>
                </div>
            </div>
        `;
    }

    renderContent() {
        switch (this.currentView) {
            case 'products': return this.renderProducts();
            case 'cart': return this.renderCart();
            case 'orders': return this.renderOrders();
            case 'account': return this.renderAccount();
            default: return '';
        }
    }

    renderLogin() {
        return `
            <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 400px; width: 90%; border: 3px solid #000;">
                    <h2 style="text-align: center; color: #333; margin-bottom: 30px; font-size: 28px;">🛒 Customer Login</h2>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #555;">Name</label>
                        <input type="text" id="customerName" placeholder="Enter your name" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 25px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #555;">Mobile Number</label>
                        <input type="tel" id="customerMobile" placeholder="Enter mobile number" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
                    </div>
                    <button onclick="customerApp.login(document.getElementById('customerName').value, document.getElementById('customerMobile').value)" 
                            style="width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 18px; font-weight: 700; cursor: pointer; transition: transform 0.2s;">
                        Login
                    </button>
                </div>
            </div>
        `;
    }

    renderProducts() {
        const products = dataManager.getProducts().filter(p => p.stock > 0);
        const categories = [...new Set(products.map(p => p.category))];

        return `
            <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
                <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">Browse Products</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                    ${products.map(product => `
                        <div style="background: white; border: 2px solid #000; border-radius: 12px; overflow: hidden; transition: transform 0.2s; cursor: pointer;" 
                             onmouseover="this.style.transform='translateY(-5px)'" 
                             onmouseout="this.style.transform='translateY(0)'">
                            <div style="padding: 20px;">
                                <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #333;">${product.name}</h3>
                                <p style="color: #666; font-size: 14px; margin-bottom: 8px;">${product.brand}</p>
                                <p style="color: #999; font-size: 12px; margin-bottom: 12px;">${product.category}</p>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                    <span style="font-size: 24px; font-weight: 700; color: #667eea;">₹${product.prices[0].price}</span>
                                    <span style="font-size: 12px; color: ${product.stock < 10 ? '#ff1744' : '#4caf50'}; font-weight: 600;">
                                        ${product.stock < 10 ? 'Low Stock' : 'In Stock'}
                                    </span>
                                </div>
                                <button onclick="customerApp.addToCart('${product.id}')" 
                                        style="width: 100%; padding: 10px; background: #667eea; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.3s;"
                                        onmouseover="this.style.background='#5568d3'" 
                                        onmouseout="this.style.background='#667eea'">
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderCart() {
        if (this.cart.length === 0) {
            return `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 80px; margin-bottom: 20px;">🛒</div>
                    <h2 style="font-size: 24px; color: #666; margin-bottom: 10px;">Your cart is empty</h2>
                    <p style="color: #999; margin-bottom: 30px;">Add some products to get started!</p>
                    <button onclick="customerApp.currentView = 'products'; customerApp.render();" 
                            style="padding: 12px 30px; background: #667eea; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px;">
                        Browse Products
                    </button>
                </div>
            `;
        }

        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const gst = subtotal * 0.05; // 5% GST
        const total = subtotal + gst;

        return `
            <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
                <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">Shopping Cart</h2>
                ${this.cart.map((item, index) => `
                    <div style="background: white; border: 2px solid #000; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 5px;">${item.name}</h3>
                                <p style="color: #666; font-size: 14px;">₹${item.price} each</p>
                            </div>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="display: flex; align-items: center; gap: 10px; border: 2px solid #ddd; border-radius: 8px; padding: 5px;">
                                    <button onclick="customerApp.updateCartQuantity(${index}, -1)" 
                                            style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 5px 10px;">−</button>
                                    <span style="font-weight: 700; min-width: 30px; text-align: center;">${item.quantity}</span>
                                    <button onclick="customerApp.updateCartQuantity(${index}, 1)" 
                                            style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 5px 10px;">+</button>
                                </div>
                                <span style="font-size: 20px; font-weight: 700; min-width: 80px; text-align: right;">₹${item.price * item.quantity}</span>
                                <button onclick="customerApp.removeFromCart(${index})" 
                                        style="background: #ff1744; color: white; border: none; border-radius: 6px; padding: 8px 12px; cursor: pointer;">🗑️</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
                
                <div style="background: #f5f5f5; border: 2px solid #000; border-radius: 12px; padding: 20px; margin-top: 30px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Subtotal:</span>
                        <span style="font-weight: 700;">₹${Math.round(subtotal)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>GST (5%):</span>
                        <span style="font-weight: 700;">₹${Math.round(gst)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px solid #000; font-size: 20px;">
                        <span style="font-weight: 700;">Total:</span>
                        <span style="font-weight: 700; color: #667eea;">₹${Math.round(total)}</span>
                    </div>
                </div>

                <button onclick="customerApp.placeOrder()" 
                        style="width: 100%; padding: 16px; background: #4caf50; color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: 700; cursor: pointer; margin-top: 20px; transition: background 0.3s;"
                        onmouseover="this.style.background='#45a049'" 
                        onmouseout="this.style.background='#4caf50'">
                    Place Order
                </button>
            </div>
        `;
    }

    renderOrders() {
        const bills = dataManager.getBills().filter(b => b.customerMobile === this.customerData.mobile);

        if (bills.length === 0) {
            return `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 80px; margin-bottom: 20px;">📦</div>
                    <h2 style="font-size: 24px; color: #666; margin-bottom: 10px;">No orders yet</h2>
                    <p style="color: #999;">Start shopping to see your orders here!</p>
                </div>
            `;
        }

        return `
            <div style="max-width: 900px; margin: 0 auto; padding: 20px;">
                <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">My Orders</h2>
                ${bills.map(bill => `
                    <div style="background: white; border: 2px solid #000; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #eee;">
                            <div>
                                <div style="font-weight: 700; font-size: 16px; margin-bottom: 5px;">Order #${bill.billNumber}</div>
                                <div style="color: #666; font-size: 14px;">${new Date(bill.timestamp).toLocaleDateString()}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 24px; font-weight: 700; color: #667eea;">₹${Math.round(bill.grandTotal)}</div>
                                <div style="color: #4caf50; font-size: 12px; font-weight: 600;">✓ Completed</div>
                            </div>
                        </div>
                        <div style="color: #666; font-size: 14px;">
                            ${bill.items.map(item => `
                                <div style="margin-bottom: 5px;">• ${item.productName} × ${item.quantity}</div>
                            `).join('')}
                        </div>
                        ${bill.pointsEarned > 0 ? `
                            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 10px; margin-top: 15px; color: #856404;">
                                🎉 You earned ${bill.pointsEarned} points from this order!
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderAccount() {
        const customer = dataManager.getCustomerData(this.customerData.name, this.customerData.mobile);
        const totalOrders = customer.billHistory.length;
        const totalSpent = customer.billHistory.reduce((sum, billId) => {
            const bill = dataManager.getBills().find(b => b.billNumber === billId);
            return sum + (bill ? bill.grandTotal : 0);
        }, 0);

        return `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 30px;">My Account</h2>
                
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 30px; color: white; margin-bottom: 30px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">👤</div>
                    <div style="font-size: 28px; font-weight: 700; margin-bottom: 10px;">${customer.name}</div>
                    <div style="font-size: 16px; opacity: 0.9;">📱 ${customer.mobile}</div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
                    <div style="background: white; border: 2px solid #000; border-radius: 12px; padding: 20px; text-align: center;">
                        <div style="font-size: 36px; font-weight: 700; color: #667eea; margin-bottom: 5px;">${customer.points}</div>
                        <div style="color: #666; font-size: 14px;">Reward Points</div>
                    </div>
                    <div style="background: white; border: 2px solid #000; border-radius: 12px; padding: 20px; text-align: center;">
                        <div style="font-size: 36px; font-weight: 700; color: #4caf50; margin-bottom: 5px;">${totalOrders}</div>
                        <div style="color: #666; font-size: 14px;">Total Orders</div>
                    </div>
                </div>

                <div style="background: white; border: 2px solid #000; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 15px;">Statistics</h3>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                        <span style="color: #666;">Total Spent:</span>
                        <span style="font-weight: 700;">₹${Math.round(totalSpent)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                        <span style="color: #666;">Wishlist Items:</span>
                        <span style="font-weight: 700;">${customer.wishlist.length}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                        <span style="color: #666;">Member Since:</span>
                        <span style="font-weight: 700;">${new Date(customer.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                </div>

                <button onclick="customerApp.logout()" 
                        style="width: 100%; padding: 14px; background: #ff1744; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer;">
                    Logout
                </button>
            </div>
        `;
    }

    addToCart(productId) {
        const product = dataManager.getProductById(productId);
        if (!product || product.stock === 0) {
            alert('Product not available');
            return;
        }

        const existingItem = this.cart.find(item => item.productId === productId);
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity++;
            } else {
                alert('Cannot add more than available stock');
                return;
            }
        } else {
            this.cart.push({
                productId: product.id,
                name: product.name,
                brand: product.brand,
                price: product.prices[0].price,
                quantity: 1,
                maxStock: product.stock
            });
        }

        this.render();
        alert('✓ Added to cart!');
    }

    updateCartQuantity(index, change) {
        const item = this.cart[index];
        item.quantity += change;

        if (item.quantity <= 0) {
            this.cart.splice(index, 1);
        } else if (item.quantity > item.maxStock) {
            alert('Cannot exceed available stock');
            item.quantity = item.maxStock;
        }

        this.render();
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.render();
    }

    placeOrder() {
        if (this.cart.length === 0) {
            alert('Cart is empty');
            return;
        }

        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const gst = subtotal * 0.05;
        const total = subtotal + gst;

        const request = {
            id: 'REQ-' + Date.now(),
            customerName: this.customerData.name,
            customerMobile: this.customerData.mobile,
            items: this.cart.map(item => ({
                productId: item.productId,
                productName: item.name,
                brand: item.brand,
                quantity: item.quantity,
                basePrice: item.price,
                total: item.price * item.quantity
            })),
            subtotal: subtotal,
            totalGST: gst,
            grandTotal: total,
            totalOfferDiscount: 0,
            pointsUsed: 0,
            pointsDiscount: 0,
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        dataManager.addRequest(request);
        this.cart = [];
        alert('✓ Order placed successfully! Waiting for retailer approval.');
        this.currentView = 'orders';
        this.render();
    }

    attachEventListeners() {
        // Event listeners are inline in the HTML
    }
}

// Initialize app
const customerApp = new CustomerApp();
