// ============================================
// RETAILER DASHBOARD - MAIN APPLICATION
// ============================================

class RetailerApp {
    constructor() {
        this.isLoggedIn = !!sessionStorage.getItem('kirana_retailer_auth');
        this.currentView = this.isLoggedIn ? 'dashboard' : 'login';
        this.modal = null;
        this.billFilters = { search: '', sortBy: 'date-desc' };
        this.customerFilters = { search: '' };
        this.init();
    }

    init() {
        // Init listener but don't auto-render if not logged in
        dataManager.addListener((type) => {
            if (this.currentView === 'login') return; // Stay on login
            if (this.modal && (type === 'sync' || type === 'offer' || type === 'product')) return;
            this.render();
        });
        this.render();
    }

    processLogin() {
        const mobileInput = document.getElementById('loginMobile').value.trim();
        const passwordInput = document.getElementById('loginPassword').value.trim();
        const shopInfo = dataManager.getShopInfo();
        const settings = dataManager.getSettings();

        // Clean mobile numbers for comparison (remove spaces/dashes)
        const registeredMobile = (shopInfo.phone || "").replace(/\D/g, '');
        const enteredMobile = mobileInput.replace(/\D/g, '');

        const savedPassword = settings.adminPassword || "";

        // 1. FIRST TIME SETUP CHECK
        // If no password is set, allow them to enter with JUST the mobile matching, 
        // OR a default fallback if even mobile is default.
        if (savedPassword === "") {
            // If they match the default PIN '1234' on password field, allow
            if (passwordInput === '1234') {
                alert('⚠️ You are using the default PIN (1234).\nPlease set a real Admin Password in Settings immediately.');
                this.isLoggedIn = true;
                sessionStorage.setItem('kirana_retailer_auth', 'valid_token_' + Date.now()); // Persist login
                this.currentView = 'dashboard'; // Set view to dashboard on successful login
                this.render();
                return;
            }
        }

        // 2. STRICT VALIDATION
        // Check if the input (last 10 digits) matches the registered phone (last 10 digits)
        const input10 = enteredMobile.slice(-10);
        const registered10 = registeredMobile.slice(-10);

        // DEBUG LOGGING (remove after testing)
        console.log('[Login Debug] Registered Mobile:', shopInfo.phone);
        console.log('[Login Debug] Entered Mobile:', mobileInput);
        console.log('[Login Debug] Last 10 Match:', input10 === registered10);
        console.log('[Login Debug] Saved Password:', savedPassword);
        console.log('[Login Debug] Entered Password:', passwordInput);
        console.log('[Login Debug] Password Match:', passwordInput === savedPassword);

        if (input10 !== registered10) {
            alert('❌ Mobile Number does not match Shop Records.\nExpected: ' + shopInfo.phone + '\nYou entered: ' + mobileInput);
            return;
        }

        if (passwordInput !== savedPassword) {
            alert('❌ Incorrect Password.\nExpected: ' + savedPassword + '\nYou entered: ' + passwordInput + '\n\n(This debug will be removed in production)');
            return;
        }

        // Success
        this.isLoggedIn = true;
        sessionStorage.setItem('kirana_retailer_auth', 'valid_token_' + Date.now()); // Persist login
        this.currentView = 'dashboard'; // Set view to dashboard on successful login
        this.render();
    }

    logout() {
        sessionStorage.removeItem('kirana_retailer_auth');
        this.isLoggedIn = false; // Update login state
        this.currentView = 'login';
        this.render();
    }

    // ============================================
    // RENDER MAIN
    // ============================================

    render() {
        const app = document.getElementById('app');
        if (!app) return;

        // If not logged in, only render the login page
        if (!this.isLoggedIn) {
            app.innerHTML = this.renderLoginPage();
            return;
        }

        // Focus Preservation
        const activeElement = document.activeElement;
        const focusedId = activeElement ? activeElement.id : null;
        let cursorStart = null, cursorEnd = null;
        let focusedValue = null;

        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            focusedValue = activeElement.value;
            try {
                cursorStart = activeElement.selectionStart;
                cursorEnd = activeElement.selectionEnd;
            } catch (e) { }
        }



        // Ensure Shell Structure
        if (!document.getElementById('retailer-shell')) {
            app.innerHTML = `
                <div id="retailer-shell">
                    <div id="retailer-header"></div>
                    <div id="retailer-nav"></div>
                    <div id="retailer-content"></div>
                </div>
                <div id="retailer-modal"></div>
            `;
        }

        // Update Header & Nav (Always safe)
        document.getElementById('retailer-header').innerHTML = this.renderHeader();
        document.getElementById('retailer-nav').innerHTML = this.renderNavigation();

        // Update Content Smartly
        const contentDiv = document.getElementById('retailer-content');
        const currentViewId = this.currentView;

        // Check if we can perform a Soft Update (Update list without destroying inputs)
        const canSoft = ['bills', 'customers', 'requests', 'products', 'offers', 'settings'].includes(currentViewId);
        const isSameView = contentDiv.dataset.view === currentViewId;

        // Login View Override
        if (currentViewId === 'login') {
            app.innerHTML = this.renderLoginPage();
            return;
        }

        if (isSameView && canSoft) {
            if (currentViewId === 'bills' && this.refreshBillsList) this.refreshBillsList();
            else if (currentViewId === 'customers' && this.refreshCustomersList) this.refreshCustomersList();
            else if (currentViewId === 'requests' && this.refreshRequestsList) this.refreshRequestsList();
            else if (currentViewId === 'products' && this.refreshProductsList) this.refreshProductsList();
            else if (currentViewId === 'offers' && this.refreshOffersList) this.refreshOffersList();
            else if (currentViewId === 'settings') this.refreshSettings(); // Maintain settings state
            else contentDiv.innerHTML = this.renderContent();
        } else {
            // Hard Render (View Changed or First Load)
            contentDiv.innerHTML = this.renderContent();
            contentDiv.dataset.view = currentViewId;
        }

        // Update Modal
        const modalDiv = document.getElementById('retailer-modal');
        if (modalDiv) modalDiv.innerHTML = this.modal || '';

        this.attachEventListeners();

        // Restore Focus & Value
        if (focusedId) {
            const el = document.getElementById(focusedId);
            if (el) {
                // Restore value to preserve typing (otherwise re-render resets it to DB value)
                if (focusedValue !== null && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
                    el.value = focusedValue;
                }

                el.focus();
                if (cursorStart !== null) {
                    try { el.setSelectionRange(cursorStart, cursorEnd); } catch (e) { }
                }
            }
        }
    }

    renderHeader() {
        const shopInfo = dataManager.getShopInfo();
        return `
            <div class="retailer-header">
                <h1>🏪 ${shopInfo.name} - Retailer Dashboard</h1>
                <p style="color: #1a1a1a; font-size: 14px; margin-top: 8px;">Manage your store efficiently</p>
            </div>
        `;
    }

    renderNavigation() {
        const requests = dataManager.getRequests().filter(r => r.status === 'pending');
        const tabs = [
            { id: 'dashboard', label: '📊 Dashboard', badge: null },
            { id: 'requests', label: '📥 Requests', badge: requests.length },
            { id: 'bills', label: '📄 Bills', badge: null },
            { id: 'products', label: '📦 Products', badge: null },
            { id: 'offers', label: '🎁 Offers', badge: null },
            { id: 'customers', label: '👥 Customers', badge: null },
            { id: 'settings', label: '⚙️ Settings', badge: null }
        ];

        return `
            <div class="nav-tabs">
                ${tabs.map(tab => `
                    <div class="nav-tab ${this.currentView === tab.id ? 'active' : ''}" 
                         onclick="retailerApp.currentView = '${tab.id}'; retailerApp.render();">
                        ${tab.label}
                        ${tab.badge ? `<span style="background: #ff1744; color: white; padding: 2px 8px; border-radius: 12px; margin-left: 8px; font-size: 12px; border: 2px solid black;">${tab.badge}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderContent() {
        switch (this.currentView) {
            case 'dashboard': return this.renderDashboard();
            case 'requests': return this.renderRequests();
            case 'bills': return this.renderBills();
            case 'products': return this.renderProducts();
            case 'offers': return this.renderOffers();
            case 'customers': return this.renderCustomers();
            case 'settings': return this.renderSettings();
            default: return '';
        }
    }

    // ============================================
    // DASHBOARD WITH 30+ INSIGHTS
    // ============================================

    renderDashboard() {
        const insights = this.calculateInsights();
        const lowStock = dataManager.getProducts().filter(p => p.stock > 0 && p.stock <= dataManager.getSettings().lowStockThreshold);
        const wishlistData = this.getWishlistInsights();

        return `
            <div class="retailer-container">
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-label">Total Revenue</div>
                        <div class="metric-value">₹${insights.totalRevenue}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Total Bills</div>
                        <div class="metric-value">${insights.totalBills}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Inventory Count</div>
                        <div class="metric-value">${insights.inventoryCount}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Pending Requests</div>
                        <div class="metric-value">${insights.pendingRequests}</div>
                    </div>
                </div>

                ${lowStock.length > 0 ? `
                    <div class="alert-box warning">
                        <strong>⚠️ Low Stock Alert:</strong> ${lowStock.length} product(s) running low: ${lowStock.map(p => p.name).join(', ')}
                    </div>
                ` : ''}

                <div class="insights-section">
                    <h3>📈 Business Insights (33 Real-Time Metrics)</h3>
                    <div class="insights-grid">
                        ${Object.entries(insights.detailedMetrics).map(([key, value]) => `
                            <div class="insight-card">
                                <div class="insight-title">${this.formatInsightTitle(key)}</div>
                                <div class="insight-value">${value}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${wishlistData.length > 0 ? `
                    <div class="insights-section">
                        <h3>❤️ High Demand Wishlist Products</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Brand</th>
                                    <th>Times Wishlisted</th>
                                    <th>Stock</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${wishlistData.map(item => `
                                    <tr>
                                        <td style="font-weight: 700; color: black;">${item.product.name}</td>
                                        <td>${item.product.brand}</td>
                                        <td style="font-weight: 700; color: #ff1744;">${item.count}</td>
                                        <td>${item.product.stock}</td>
                                        <td>
                                            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" 
                                                    onclick="retailerApp.currentView = 'offers'; retailerApp.render();">
                                                Create Offer
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
            </div>
        `;
    }

    calculateInsights() {
        const bills = dataManager.getBills();
        const products = dataManager.getProducts();
        const requests = dataManager.getRequests();
        const customers = dataManager.getAllCustomers();
        const offers = dataManager.getActiveOffers();

        const totalRevenue = bills.reduce((sum, b) => sum + b.grandTotal, 0);
        const totalBills = bills.length;
        const pendingRequests = requests.filter(r => r.status === 'pending').length;
        const inventoryCount = products.length;

        // Calculate 33 detailed metrics
        const detailedMetrics = {
            totalRevenue: `₹${Math.round(totalRevenue)}`,
            avgBillValue: `₹${bills.length ? Math.round(totalRevenue / bills.length) : 0}`,
            totalCustomers: Object.keys(customers).length,
            repeatCustomers: Object.values(customers).filter(c => c.billHistory && c.billHistory.length > 1).length,
            totalProductsSold: bills.reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0),
            totalGSTCollected: `₹${Math.round(bills.reduce((sum, b) => sum + b.totalGST, 0))}`,
            totalDiscountsGiven: `₹${Math.round(bills.reduce((sum, b) => sum + (b.totalOfferDiscount || 0), 0))}`,
            totalPointsIssued: bills.reduce((sum, b) => sum + (b.pointsEarned || 0), 0),
            totalPointsRedeemed: bills.reduce((sum, b) => sum + (b.pointsUsed || 0), 0),
            activeOffers: offers.length,
            lowStockItems: products.filter(p => p.stock > 0 && p.stock <= 10).length,
            outOfStockItems: products.filter(p => p.stock === 0).length,
            totalInventoryValue: `₹${Math.round(products.reduce((sum, p) => sum + (p.prices[0].price * p.stock), 0))}`,
            avgProductPrice: `₹${products.length ? Math.round(products.reduce((sum, p) => sum + p.prices[0].price, 0) / products.length) : 0}`,
            topCategory: this.getTopCategory(bills),
            topBrand: this.getTopBrand(bills),
            conversionRate: `${requests.length ? Math.round((bills.length / requests.length) * 100) : 0}%`,
            avgItemsPerBill: bills.length ? (bills.reduce((sum, b) => sum + b.items.length, 0) / bills.length).toFixed(1) : 0,
            todayRevenue: `₹${this.getTodayRevenue(bills)}`,
            thisWeekRevenue: `₹${this.getWeekRevenue(bills)}`,
            thisMonthRevenue: `₹${this.getMonthRevenue(bills)}`,
            todayBills: this.getTodayBills(bills).length,
            avgGSTPerBill: `₹${bills.length ? Math.round(bills.reduce((sum, b) => sum + b.totalGST, 0) / bills.length) : 0}`,
            profitMargin: this.calculateProfitMargin(bills),
            customerRetention: `${Object.keys(customers).length ? Math.round((Object.values(customers).filter(c => c.billHistory && c.billHistory.length > 1).length / Object.keys(customers).length) * 100) : 0}%`,
            avgDiscountPerBill: `₹${bills.length ? Math.round(bills.reduce((sum, b) => sum + (b.totalOfferDiscount || 0), 0) / bills.length) : 0}`,
            totalCategories: [...new Set(products.map(p => p.category))].length,
            totalBrands: [...new Set(products.map(p => p.brand))].length,
            pendingValue: `₹${Math.round(requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.grandTotal, 0))}`,
            rejectedRequests: requests.filter(r => r.status === 'rejected').length,
            approvalRate: `${requests.length ? Math.round((bills.length / requests.length) * 100) : 0}%`,
            avgStockPerProduct: products.length ? Math.round(products.reduce((sum, p) => sum + p.stock, 0) / products.length) : 0,
            wishlistTotal: Object.values(customers).reduce((sum, c) => sum + (c.wishlist ? c.wishlist.length : 0), 0)
        };

        return { totalRevenue: Math.round(totalRevenue), totalBills, pendingRequests, inventoryCount, detailedMetrics };
    }

    formatInsightTitle(key) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    getTopCategory(bills) {
        const categories = {};
        bills.forEach(b => b.items.forEach(i => {
            const product = dataManager.getProductById(i.productId);
            if (product) categories[product.category] = (categories[product.category] || 0) + i.quantity;
        }));
        const top = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
        return top ? top[0] : 'N/A';
    }

    getTopBrand(bills) {
        const brands = {};
        bills.forEach(b => b.items.forEach(i => {
            brands[i.brand] = (brands[i.brand] || 0) + i.quantity;
        }));
        const top = Object.entries(brands).sort((a, b) => b[1] - a[1])[0];
        return top ? top[0] : 'N/A';
    }

    getTodayRevenue(bills) {
        const today = new Date().toDateString();
        return Math.round(bills.filter(b => new Date(b.timestamp).toDateString() === today).reduce((sum, b) => sum + b.grandTotal, 0));
    }

    getWeekRevenue(bills) {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return Math.round(bills.filter(b => new Date(b.timestamp) >= weekAgo).reduce((sum, b) => sum + b.grandTotal, 0));
    }

    getMonthRevenue(bills) {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return Math.round(bills.filter(b => new Date(b.timestamp) >= monthAgo).reduce((sum, b) => sum + b.grandTotal, 0));
    }

    getTodayBills(bills) {
        const today = new Date().toDateString();
        return bills.filter(b => new Date(b.timestamp).toDateString() === today);
    }

    calculateProfitMargin(bills) {
        const revenue = bills.reduce((sum, b) => sum + b.grandTotal, 0);
        const discounts = bills.reduce((sum, b) => sum + (b.totalOfferDiscount || 0), 0);
        const margin = revenue > 0 ? ((revenue - discounts) / revenue * 100) : 0;
        return `${Math.round(margin)}%`;
    }

    getWishlistInsights() {
        const customers = dataManager.getAllCustomers();
        const wishlistCounts = {};

        Object.values(customers).forEach(customer => {
            customer.wishlist.forEach(productId => {
                wishlistCounts[productId] = (wishlistCounts[productId] || 0) + 1;
            });
        });

        return Object.entries(wishlistCounts)
            .map(([productId, count]) => ({
                product: dataManager.getProductById(productId),
                count
            }))
            .filter(item => item.product)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    // ============================================
    // REQUESTS MANAGEMENT
    // ============================================

    renderRequests() {
        if (!this.requestFilters) this.requestFilters = { search: '' };

        const contentHTML = this.generateRequestsHTML();

        return `
            <div class="retailer-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="font-size: 24px; font-weight: 700; color: black; margin: 0;">📥 Pending Requests</h2>
                    <input type="text" placeholder="Search customer or mobile..." 
                           value="${this.requestFilters.search}"
                           oninput="retailerApp.requestFilters.search = this.value; retailerApp.refreshRequestsList()"
                           style="padding: 8px; border: 2px solid black; border-radius: 6px; width: 250px;">
                </div>
                <div class="requests-list" id="requestsListContainer">
                    ${contentHTML}
                </div>
            </div>
        `;
    }

    refreshRequestsList() {
        document.getElementById('requestsListContainer').innerHTML = this.generateRequestsHTML();
    }

    generateRequestsHTML() {
        let requests = dataManager.getRequests().filter(r => r.status === 'pending');

        if (this.requestFilters && this.requestFilters.search) {
            const term = this.requestFilters.search.toLowerCase();
            requests = requests.filter(r =>
                r.customerName.toLowerCase().includes(term) ||
                r.customerMobile.includes(term)
            );
        }

        if (requests.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📥</div>
                    <div class="empty-state-text">No pending requests matched</div>
                </div>
            `;
        }

        return requests.map(req => this.renderRequestCard(req)).join('');
    }

    renderRequestCard(req) {
        return `
            <div class="request-card">
                <div class="request-header">
                    <div>
                        <div class="request-customer">👤 ${req.customerName}</div>
                        <div class="request-time">📱 ${req.customerMobile} • ${new Date(req.timestamp).toLocaleString()}</div>
                    </div>
                    <div style="font-size: 24px; font-weight: 700; color: black;">₹${Math.round(req.grandTotal)}</div>
                </div>
                
                <div class="request-items">
                    ${req.items.map(item => `
                        <div class="request-item">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 700; color: black;">${item.productName}</div>
                                    <div style="font-size: 12px; color: #1a1a1a;">${item.brand} • Qty: ${item.quantity}</div>
                                </div>
                                <div style="font-weight: 700; color: black;">₹${Math.round(item.total)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="background: #f5f5f5; border: 2px solid black; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: black;">Subtotal:</span>
                        <span style="font-weight: 700; color: black;">₹${Math.round(req.subtotal)}</span>
                    </div>
                    ${req.totalOfferDiscount > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #00c853;">
                            <span>Offer Discount:</span>
                            <span style="font-weight: 700;">-₹${Math.round(req.totalOfferDiscount)}</span>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: black;">GST:</span>
                        <span style="font-weight: 700; color: black;">₹${Math.round(req.totalGST)}</span>
                    </div>
                    ${req.pointsDiscount > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #ff1744;">
                            <span>Points Used (${req.pointsUsed} pts):</span>
                            <span style="font-weight: 700;">-₹${Math.round(req.pointsDiscount)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="request-actions">
                    <button class="btn btn-success" onclick="retailerApp.approveRequest('${req.id}')">✅ Accept</button>
                    <button class="btn btn-danger" onclick="retailerApp.rejectRequest('${req.id}')">❌ Reject</button>
                </div>
            </div>
        `;
    }

    approveRequest(requestId) {
        const request = dataManager.getRequests().find(r => r.id === requestId);
        if (!request) return;

        // Check customer's current points
        const customerData = dataManager.getCustomerData(request.customerName, request.customerMobile);
        let actualPointsUsed = 0;
        let actualPointsDiscount = 0;
        let adjustedTotal = request.grandTotal;

        if (request.pointsUsed > 0) {
            if (customerData.points >= request.pointsUsed) {
                actualPointsUsed = request.pointsUsed;
                actualPointsDiscount = request.pointsDiscount;
            } else {
                // Auto-correct: Remove points discount
                actualPointsUsed = 0;
                actualPointsDiscount = 0;
                adjustedTotal = request.grandTotal + request.pointsDiscount;
                alert(`Customer tried to use ${request.pointsUsed} points but only has ${customerData.points}. Bill adjusted to ₹${Math.round(adjustedTotal)}`);
            }
        }

        // Deduct points if used
        if (actualPointsUsed > 0) {
            customerData.points -= actualPointsUsed;
        }

        // Calculate points earned
        const settings = dataManager.getSettings();
        const pointsEarned = Math.floor(adjustedTotal / settings.pointsRatio);
        customerData.points += pointsEarned;

        // Update stock
        for (const item of request.items) {
            const product = dataManager.getProductById(item.productId);
            if (product) {
                product.stock = Math.max(0, product.stock - item.quantity);
                dataManager.updateProduct(product.id, product);
            }
        }

        // Create bill
        const bill = {
            ...request,
            pointsUsed: actualPointsUsed,
            pointsDiscount: actualPointsDiscount,
            grandTotal: adjustedTotal,
            pointsEarned,
            status: 'approved'
        };
        dataManager.addBill(bill);

        // Update customer data
        dataManager.updateCustomerData(request.customerName, request.customerMobile, customerData);

        // Remove request
        dataManager.deleteRequest(requestId);

        alert(`Bill approved! Customer earned ${pointsEarned} points.`);
        this.render();
    }

    rejectRequest(requestId) {
        if (confirm('Are you sure you want to reject this request?')) {
            dataManager.updateRequest(requestId, { status: 'rejected' });
            dataManager.deleteRequest(requestId);
            this.render();
        }
    }

    // ============================================
    // BILLS (Continued in next part due to length)
    // ============================================

    renderBills() {
        const rowsHTML = this.generateBillsRows();

        return `
            <div class="retailer-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
                    <h2 style="font-size: 24px; font-weight: 700; color: black; margin: 0;">📄 Approved Bills</h2>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <input type="text" id="billSearchInput" placeholder="Search name, mobile, bill #..." 
                               value="${this.billFilters.search}"
                               oninput="retailerApp.billFilters.search = this.value; retailerApp.refreshBillsList()"
                               style="padding: 8px; border: 2px solid black; border-radius: 6px; width: 220px;">
                        
                        <input type="date" id="billDateInput" 
                               value="${this.billFilters.date || ''}"
                               onchange="retailerApp.billFilters.date = this.value; retailerApp.refreshBillsList()"
                               style="padding: 8px; border: 2px solid black; border-radius: 6px;">

                        <select id="billSortInput" onchange="retailerApp.billFilters.sortBy = this.value; retailerApp.refreshBillsList()"
                                style="padding: 8px; border: 2px solid black; border-radius: 6px;">
                            <option value="date-desc" ${this.billFilters.sortBy === 'date-desc' ? 'selected' : ''}>Newest First</option>
                            <option value="date-asc" ${this.billFilters.sortBy === 'date-asc' ? 'selected' : ''}>Oldest First</option>
                            <option value="amount-desc" ${this.billFilters.sortBy === 'amount-desc' ? 'selected' : ''}>Highest Amount</option>
                            <option value="amount-asc" ${this.billFilters.sortBy === 'amount-asc' ? 'selected' : ''}>Lowest Amount</option>
                        </select>
                    </div>
                </div>

                <div class="table-container" style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Bill #</th>
                                <th>Customer</th>
                                <th>Mobile</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="billsTableBody">
                            ${rowsHTML}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    refreshBillsList() {
        document.getElementById('billsTableBody').innerHTML = this.generateBillsRows();
    }

    generateBillsRows() {
        let bills = dataManager.getBills();

        // Filter Search
        if (this.billFilters.search) {
            const term = this.billFilters.search.toLowerCase();
            bills = bills.filter(b =>
                b.customerName.toLowerCase().includes(term) ||
                b.customerMobile.includes(term) ||
                b.billNumber.toLowerCase().includes(term)
            );
        }

        // Filter Date
        if (this.billFilters.date) {
            const filterDate = new Date(this.billFilters.date).toDateString();
            bills = bills.filter(b => new Date(b.timestamp).toDateString() === filterDate);
        }

        // Sort
        switch (this.billFilters.sortBy) {
            case 'date-desc': bills.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); break;
            case 'date-asc': bills.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); break;
            case 'amount-desc': bills.sort((a, b) => b.grandTotal - a.grandTotal); break;
            case 'amount-asc': bills.sort((a, b) => a.grandTotal - b.grandTotal); break;
        }

        if (bills.length === 0) {
            return '<tr><td colspan="7" style="text-align:center; padding: 20px;">No bills found</td></tr>';
        }

        return bills.map(bill => `
            <tr>
                <td style="font-weight: 700; color: black;">${bill.billNumber}</td>
                <td>${bill.customerName}</td>
                <td>${bill.customerMobile}</td>
                <td>${bill.items.length}</td>
                <td style="font-weight: 700; color: black;">₹${Math.round(bill.grandTotal)}</td>
                <td>${new Date(bill.timestamp).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; margin-right: 4px;" 
                            onclick="retailerApp.viewBill('${bill.billNumber}')">View</button>
                    <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; margin-right: 4px;" 
                            onclick="retailerApp.printBill('${bill.billNumber}')">Print</button>
                    <button class="btn btn-success" style="padding: 6px 12px; font-size: 12px;" 
                            onclick="retailerApp.shareBill('${bill.billNumber}')">Share</button>
                </td>
            </tr>
        `).join('');
    }

    viewBill(billNumber) {
        const bill = dataManager.getBills().find(b => b.billNumber === billNumber);
        if (!bill) return;

        const shopInfo = dataManager.getShopInfo();
        this.modal = `
            <div class="modal-overlay" onclick="if(event.target === this) retailerApp.closeModal()">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2>Bill Details</h2>
                        <button class="modal-close" onclick="retailerApp.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid black;">
                            <h3 style="font-size: 20px; font-weight: 700; color: black;">${shopInfo.name}</h3>
                            <p style="font-size: 12px; color: #1a1a1a;">${shopInfo.address}</p>
                            <p style="font-size: 12px; color: #1a1a1a;">GSTIN: ${shopInfo.gstin}</p>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <div style="font-weight: 700; color: black;">Bill #: ${bill.billNumber}</div>
                            <div style="font-size: 12px; color: #1a1a1a;">Date: ${new Date(bill.timestamp).toLocaleString()}</div>
                            <div style="font-weight: 700; color: black; margin-top: 8px;">Customer: ${bill.customerName}</div>
                            <div style="font-size: 12px; color: #1a1a1a;">Mobile: ${bill.customerMobile}</div>
                        </div>

                        <table style="width: 100%; border: 2px solid black; margin-bottom: 16px;">
                            <thead>
                                <tr style="background: black; color: white;">
                                    <th style="padding: 8px; text-align: left; border: 1px solid black;">Item</th>
                                    <th style="padding: 8px; text-align: right; border: 1px solid black;">Qty</th>
                                    <th style="padding: 8px; text-align: right; border: 1px solid black;">Price</th>
                                    <th style="padding: 8px; text-align: right; border: 1px solid black;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bill.items.map(item => `
                                    <tr>
                                        <td style="padding: 8px; border: 1px solid black; color: black;">${item.productName}</td>
                                        <td style="padding: 8px; text-align: right; border: 1px solid black; color: black;">${item.quantity}</td>
                                        <td style="padding: 8px; text-align: right; border: 1px solid black; color: black;">₹${Math.round(item.basePrice)}</td>
                                        <td style="padding: 8px; text-align: right; border: 1px solid black; color: black;">₹${Math.round(item.total)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div style="text-align: right; font-size: 14px; color: black;">
                            <div>Subtotal: ₹${Math.round(bill.subtotal)}</div>
                            ${bill.totalOfferDiscount > 0 ? `<div style="color: #00c853;">Discount: -₹${Math.round(bill.totalOfferDiscount)}</div>` : ''}
                            <div>GST: ₹${Math.round(bill.totalGST)}</div>
                            ${bill.pointsDiscount > 0 ? `<div style="color: #ff1744;">Points: -₹${Math.round(bill.pointsDiscount)}</div>` : ''}
                            <div style="font-size: 18px; font-weight: 700; margin-top: 8px; padding-top: 8px; border-top: 2px solid black;">Grand Total: ₹${Math.round(bill.grandTotal)}</div>
                        </div>

                        <div style="margin-top: 16px; padding: 12px; background: #f5f5f5; border: 2px solid black; border-radius: 8px; font-size: 11px; color: black;">
                            <strong>Return Policy:</strong> Products can be returned within 2 days from purchase date. No returns accepted for seal breakage products.
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.render();
    }

    printBill(billNumber) {
        const bill = dataManager.getBills().find(b => b.billNumber === billNumber);
        if (!bill) return;

        const shopInfo = dataManager.getShopInfo();
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <html>
            <head>
                <title>Bill ${bill.billNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: black; }
                    h2 { text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid black; padding: 8px; text-align: left; }
                    th { background: black; color: white; }
                    .total { font-weight: bold; font-size: 18px; }
                </style>
            </head>
            <body>
                <h2>${shopInfo.name}</h2>
                <p style="text-align: center;">${shopInfo.address}<br>GSTIN: ${shopInfo.gstin}</p>
                <hr>
                <p><strong>Bill #:</strong> ${bill.billNumber}<br>
                <strong>Date:</strong> ${new Date(bill.timestamp).toLocaleString()}<br>
                <strong>Customer:</strong> ${bill.customerName}<br>
                <strong>Mobile:</strong> ${bill.customerMobile}</p>
                <table>
                    <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                    ${bill.items.map(item => `
                        <tr>
                            <td>${item.productName}</td>
                            <td>${item.quantity}</td>
                            <td>₹${Math.round(item.basePrice)}</td>
                            <td>₹${Math.round(item.total)}</td>
                        </tr>
                    `).join('')}
                </table>
                <p style="text-align: right;">
                    Subtotal: ₹${Math.round(bill.subtotal)}<br>
                    ${bill.totalOfferDiscount > 0 ? `Discount: -₹${Math.round(bill.totalOfferDiscount)}<br>` : ''}
                    GST: ₹${Math.round(bill.totalGST)}<br>
                    ${bill.pointsDiscount > 0 ? `Points: -₹${Math.round(bill.pointsDiscount)}<br>` : ''}
                    <span class="total">Grand Total: ₹${Math.round(bill.grandTotal)}</span>
                </p>
                <p style="font-size: 11px; border: 1px solid black; padding: 10px;">
                    <strong>Return Policy:</strong> Products can be returned within 2 days from purchase date. No returns accepted for seal breakage products.
                </p>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    shareBill(billNumber) {
        const bill = dataManager.getBills().find(b => b.billNumber === billNumber);
        if (!bill) return;

        const shopInfo = dataManager.getShopInfo();
        const message = `*${shopInfo.name}*%0A` +
            `Bill: ${bill.billNumber}%0A` +
            `Customer: ${bill.customerName}%0A` +
            `Total: ₹${Math.round(bill.grandTotal)}%0A` +
            `Date: ${new Date(bill.timestamp).toLocaleDateString()}%0A%0A` +
            `Thank you for shopping with us!`;

        const whatsappURL = `https://wa.me/${bill.customerMobile.replace(/\D/g, '')}?text=${message}`;
        window.open(whatsappURL, '_blank');
    }

    closeModal() {
        this.modal = null;
        this.render();
    }

    // Products, Offers, Customers, Settings will continue...
    // Due to token limits, I'll create a second file for remaining features

    renderProducts() {
        return `<div class="retailer-container"><h2 style="color: black;">Products section - See retailer2.js</h2></div>`;
    }

    renderOffers() {
        return `<div class="retailer-container"><h2 style="color: black;">Offers section - See retailer2.js</h2></div>`;
    }

    renderCustomers() {
        const gridHTML = this.generateCustomersGrid();

        return `
            <div class="retailer-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="font-size: 24px; font-weight: 700; color: black; margin: 0;">👥 Customer Records</h2>
                    <input type="text" placeholder="Search customer name or mobile..." 
                           value="${this.customerFilters.search}"
                           oninput="retailerApp.customerFilters.search = this.value; retailerApp.refreshCustomersList()"
                           style="padding: 8px; border: 2px solid black; border-radius: 6px; width: 300px;">
                </div>
                
                <div class="folders-grid" id="customersGrid">
                    ${gridHTML}
                </div>
            </div>
        `;
    }

    refreshCustomersList() {
        document.getElementById('customersGrid').innerHTML = this.generateCustomersGrid();
    }

    generateCustomersGrid() {
        let customers = Object.values(dataManager.getAllCustomers());

        if (this.customerFilters.search) {
            const term = this.customerFilters.search.toLowerCase();
            customers = customers.filter(c =>
                c.name.toLowerCase().includes(term) ||
                c.mobile.includes(term)
            );
        }

        if (customers.length === 0) return '<div style="grid-column: 1/-1; text-align: center; color: #666;">No customers found matching your search</div>';

        return customers.map(customer => {
            const safeName = customer.name.replace(/'/g, "\\'");
            const billCount = dataManager.getBills().filter(b =>
                b.customerName === customer.name && b.customerMobile === customer.mobile
            ).length;

            return `
            <div class="folder-card" onclick="retailerApp.viewCustomerFolder('${safeName}', '${customer.mobile}')">
                <div class="folder-icon">📁</div>
                <div class="folder-name">${customer.name}</div>
                <div class="folder-meta">📱 ${customer.mobile}</div>
                <div class="folder-meta">📄 ${billCount} bills</div>
                <div class="folder-meta">⭐ ${customer.points} points</div>
            </div>
            `;
        }).join('');
    }

    viewCustomerFolder(name, mobile) {
        const bills = dataManager.getBills().filter(b =>
            b.customerName === name && b.customerMobile === mobile
        );
        const customer = dataManager.getCustomerData(name, mobile);

        this.modal = `
            <div class="modal-overlay" onclick="if(event.target === this) retailerApp.closeModal()">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📁 ${name}'s Records</h2>
                        <button class="modal-close" onclick="retailerApp.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 16px; padding: 16px; background: #f5f5f5; border: 2px solid black; border-radius: 8px;">
                            <div style="font-weight: 700; color: black;">📱 ${mobile}</div>
                            <div style="color: black;">⭐ Points: ${customer.points}</div>
                            <div style="color: black;">❤️ Wishlist: ${customer.wishlist ? customer.wishlist.length : 0} items</div>
                        </div>
                        
                        <h3 style="color: black; margin-bottom: 12px;">Bill History (${bills.length})</h3>
                        ${bills.length === 0 ? '<p style="color: #1a1a1a;">No bills yet</p>' : `
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Bill #</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${bills.map(bill => `
                                        <tr>
                                            <td style="font-weight: 700; color: black;">${bill.billNumber}</td>
                                            <td>${new Date(bill.timestamp).toLocaleDateString()}</td>
                                            <td style="font-weight: 700; color: black;">₹${Math.round(bill.grandTotal)}</td>
                                            <td>
                                                <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" 
                                                        onclick="retailerApp.viewBill('${bill.billNumber}')">View</button>
                                                <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" 
                                                        onclick="retailerApp.printBill('${bill.billNumber}')">Print</button>
                                                <button class="btn btn-success" style="padding: 4px 8px; font-size: 11px;" 
                                                        onclick="retailerApp.shareBill('${bill.billNumber}')">Share</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `}
                    </div>
                </div>
            </div>
        `;
        this.render();
    }

    renderSettings() {
        const settings = dataManager.getSettings();
        const shopInfo = dataManager.getShopInfo();

        return `
            <div class="retailer-container">
                <h2 style="font-size: 24px; font-weight: 700; color: black; margin-bottom: 24px;">⚙️ Settings</h2>
                
                <div style="background: white; border: 3px solid black; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <h3 style="color: black; margin-bottom: 16px;">Shop Information</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Shop Name</label>
                            <input type="text" id="shopName" value="${shopInfo.name}">
                        </div>
                        <div class="form-group">
                            <label>GSTIN</label>
                            <input type="text" id="shopGSTIN" value="${shopInfo.gstin}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <input type="text" id="shopAddress" value="${shopInfo.address}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="text" id="shopPhone" value="${shopInfo.phone}">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="shopEmail" value="${shopInfo.email}">
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="retailerApp.saveShopInfo()">Save Shop Info</button>
                </div>

                <div style="background: white; border: 3px solid black; border-radius: 12px; padding: 24px;">
                    <h3 style="color: black; margin-bottom: 16px;">Points & Rewards System</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Points Ratio (₹ per 1 point)</label>
                            <input type="number" id="pointsRatio" value="${settings.pointsRatio}" step="0.1" min="0.1"
                                   oninput="retailerApp.updatePointsPreview()">
                            <small style="color: #1a1a1a; display: block; margin-top: 4px;">
                                💡 <strong>Logic:</strong> Spend <strong>₹<span id="pointsRatioPreview">${settings.pointsRatio}</span></strong> → Earn <strong>1 Point</strong>.
                            </small>
                        </div>
                        <div class="form-group">
                            <label>Point Value (₹)</label>
                            <input type="number" id="pointsValue" value="${settings.pointsValue}" step="0.01" min="0"
                                   oninput="retailerApp.updatePointsPreview()">
                            <small style="color: #1a1a1a; display: block; margin-top: 4px;">
                                💡 <strong>Logic:</strong> 1 Point = <strong>₹<span id="pointsValuePreview">${settings.pointsValue}</span></strong> discount.
                            </small>
                        </div>
                        <div class="form-group">
                            <label>Low Stock Threshold</label>
                            <input type="number" id="lowStockThreshold" value="${settings.lowStockThreshold}" min="0">
                            <small style="color: #1a1a1a; display: block; margin-top: 4px;">Warn when stock falls below this number.</small>
                        </div>
                    </div>
                    
                    <div style="background: #fff3e0; border: 2px solid #ff9800; border-radius: 8px; padding: 16px; margin-top: 16px;">
                        <div style="font-weight: 700; color: #e65100; margin-bottom: 8px;">📊 Efficiency Preview</div>
                        <div style="font-size: 14px; color: #333;">
                            If a customer buys items worth <strong>₹1000</strong>:<br>
                            • They will earn: <strong><span id="previewEarned">${Math.floor(1000 / (settings.pointsRatio || 1))}</span> Points</strong><br>
                            • These points are worth: <strong>₹<span id="previewValue">${(Math.floor(1000 / (settings.pointsRatio || 1)) * settings.pointsValue).toFixed(2)}</span></strong> in future discounts.
                        </div>
                    </div>

                    <div style="background: #f5f5f5; border: 2px solid black; border-radius: 8px; padding: 16px; margin-top: 16px;">
                        <div style="font-weight: 700; color: black; margin-bottom: 8px;">⚖️ GST Compliance (Government of India)</div>
                        <div style="font-size: 14px; color: #1a1a1a; margin-bottom: 12px;">
                            GST rates are automatically calculated based on <strong>Product Name, Brand, Category, and Price slabs</strong> (e.g., footwear/textile thresholds) as per current Indian Law.
                        </div>
                        <button class="btn btn-secondary" onclick="retailerApp.syncGSTRules()" style="font-size: 12px; padding: 8px 16px;">🔄 Sync All Products with Latest Tax Laws</button>
                    </div>

                    <div style="background: #e3f2fd; border: 2px solid #2196f3; border-radius: 8px; padding: 16px; margin-top: 16px;">
                        <div style="font-weight: 700; color: #0d47a1; margin-bottom: 8px;">🚀 Universal Migration Wizard (Switch Devices)</div>
                        <div style="font-size: 14px; color: #0d47a1; margin-bottom: 12px;">
                            Move your entire shop to a new Laptop or Android Phone in seconds.
                        </div>
                        <div style="display: flex; gap: 12px;">
                            <!-- EXPORT BUTTON -->
                            <button class="btn" style="background: #2196f3; color: white; border: none;" onclick="retailerApp.handleMigrationExport()">
                                📤 Export Master Server Data
                            </button>
                            
                            <!-- IMPORT BUTTON -->
                            <button class="btn" style="background: white; color: #2196f3; border: 2px solid #2196f3;" onclick="document.getElementById('migrationFile').click()">
                                📥 Setup New Server (Restore)
                            </button>
                            <input type="file" id="migrationFile" style="display: none;" accept=".json" onchange="retailerApp.handleMigrationImport(event)">
                        </div>
                        <div style="margin-top: 8px; font-size: 11px; color: #0d47a1;">
                            * Exports 100% of data (Products, Bills, Customers) to a single file. Keep it safe.
                        </div>
                    </div>

                    <div style="background: #fff3e0; border: 2px solid #ef6c00; border-radius: 8px; padding: 16px; margin-top: 16px;">
                        <div style="font-weight: 700; color: #ef6c00; margin-bottom: 8px;">🔐 Security Settings</div>
                        <div style="margin-bottom: 12px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 4px; color: #1a1a1a;">Set Admin Password</label>
                            <input type="password" id="adminPassword" value="${settings.adminPassword || ''}" 
                                   placeholder="Set a strong password for Retailer Login" 
                                   style="width: 100%; padding: 10px; border: 2px solid #ccc; border-radius: 6px;">
                            <div style="font-size: 11px; color: #e65100; margin-top: 4px;">
                                * This password (plus your registered mobile) will be required to log in.
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 12px; border-top: 1px solid #ffcc80; padding-top: 12px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 4px; color: #1a1a1a;">Static Backup URL (For Auto-Switch)</label>
                            <input type="url" id="offlineBackupUrl" value="${settings.offlineBackupUrl || ''}" 
                                   placeholder="e.g. https://yourname.github.io/shop.html" 
                                   style="width: 100%; padding: 10px; border: 2px solid #ccc; border-radius: 6px;">
                            <div style="font-size: 11px; color: #e65100; margin-top: 4px;">
                                * Hosting your Static Catalog on GitHub? Paste the link here. 
                                <br>If internet fails, customers will be redirected here automatically.
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-primary" style="margin-top: 24px; width: 200px;" onclick="retailerApp.saveSettings()">💾 Save Settings</button>
                </div>
            </div>
        `;
    }

    // --- MIGRATION HANDLERS ---

    handleMigrationExport() {
        if (!confirm('Download complete backup of this Master Server?')) return;
        const data = dataManager.exportCompleteData();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kirana_master_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async handleMigrationImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!confirm('WARNING: RESTORING WILL OVERWRITE ALL DATA ON THIS DEVICE.\n\nAre you sure you want to replace this shop\'s data with the backup?')) {
            event.target.value = ''; // Reset
            return;
        }

        try {
            const result = await dataManager.importCompleteData(file);
            alert(`✅ Migration Successful!\n\nRestored ${result.count} products and all shop data.\nWelcome to your new server.`);
            location.reload(); // Hard reload to reflect new state
        } catch (error) {
            alert('❌ Migration Failed: ' + error.message);
        }
    }

    refreshSettings() {
        // We don't want to re-render settings during typing
        // But we might want to update some status indicators if they existed
        // For now, just ensure the points preview matches the current input
        this.updatePointsPreview();
    }

    saveShopInfo() {
        const shopInfo = {
            name: document.getElementById('shopName').value,
            gstin: document.getElementById('shopGSTIN').value,
            address: document.getElementById('shopAddress').value,
            phone: document.getElementById('shopPhone').value,
            email: document.getElementById('shopEmail').value,
            logo: dataManager.getShopInfo().logo
        };
        dataManager.saveShopInfo(shopInfo);
        alert('Shop information saved!');
    }

    saveSettings() {
        const ratioVal = parseFloat(document.getElementById('pointsRatio').value);
        const pointsVal = parseFloat(document.getElementById('pointsValue').value);
        const stockVal = parseInt(document.getElementById('lowStockThreshold').value);

        const settings = {
            pointsRatio: Math.max(0.1, ratioVal || 100),
            pointsValue: Math.max(0, pointsVal || 0),
            lowStockThreshold: Math.max(0, stockVal || 0),
            language: dataManager.getSettings().language,
            currency: dataManager.getSettings().currency,
            gstEnabled: true,
            adminPassword: document.getElementById('adminPassword').value.trim(),
            offlineBackupUrl: document.getElementById('offlineBackupUrl').value.trim()
        };
        dataManager.saveSettings(settings);
        dataManager.syncAllProductGST(); // Auto-sync on save to be sure
        alert('Settings saved successfully!');
        this.render();
    }

    syncGSTRules() {
        if (confirm('This will update the GST rate for all existing products in your inventory based on the latest Government of India rules and price slabs. Proceed?')) {
            const count = dataManager.syncAllProductGST();
            alert(`Compliance Sync Complete! Updated GST for ${count} products.`);
            this.render();
        }
    }

    attachEventListeners() {
        // Event listeners are attached via onclick in HTML
    }
    renderLoginPage() {
        return `
            <div style="display: flex; height: 100vh; background: #f0f2f5; align-items: center; justify-content: center; font-family: 'Inter', sans-serif;">
                <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center;">
                    <h1 style="margin-bottom: 24px; color: #1a1a1a;">🔐 Retailer Secure Login</h1>
                    <p style="margin-bottom: 32px; color: #666;">Enter your Registered Mobile & Password.</p>
                    
                    <div style="text-align: left; margin-bottom: 16px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 4px; color: #444;">Registered Mobile Number</label>
                        <input type="text" id="loginMobile" placeholder="e.g. 9876543210" 
                               style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
                    </div>

                    <div style="text-align: left; margin-bottom: 24px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 4px; color: #444;">Admin Password</label>
                        <input type="password" id="loginPassword" placeholder="••••••••" 
                               style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;"
                               onkeypress="if(event.key === 'Enter') retailerApp.processLogin()">
                    </div>
                    
                    <button onclick="retailerApp.processLogin()"
                            style="width: 100%; padding: 14px; background: #000; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                        Verify & Access
                    </button>
                    
                    <div style="margin-top: 24px; font-size: 12px; color: #888;">
                        🔒 <strong>Strict Security Mode</strong><br>
                        Authentication required for every session.
                    </div>
                </div>
            </div>
        `;
    }
}

const retailerApp = new RetailerApp();
