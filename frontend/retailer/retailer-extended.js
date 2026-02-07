// ============================================
// RETAILER DASHBOARD - PRODUCTS & OFFERS
// Extended features for product and offer management
// ============================================

// Add these methods to RetailerApp class
RetailerApp.prototype.renderProducts = function () {
    if (!this.productFilters) {
        this.productFilters = {
            search: '',
            category: 'all',
            brand: 'all',
            stockStatus: 'all',
            sortBy: 'name-asc',
            minPrice: '',
            maxPrice: ''
        };
    }
    if (!this.productPagination) {
        this.productPagination = { page: 1, limit: 12 };
    }

    const html = this.generateProductsContent();

    return `
        <div class="retailer-container">
            <h2 style="font-size: 24px; font-weight: 700; color: black; margin-bottom: 24px;">📦 Product Inventory</h2>
            
            <div style="display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start;">
                <!-- SIDEBAR FILTERS -->
                <div class="filter-panel" style="background: white; border: 3px solid black; border-radius: 12px; padding: 20px; box-shadow: 4px 4px 0px rgba(0,0,0,1);">
                     ${this.generateFilterSidebar()}
                </div>

                <!-- MAIN CONTENT -->
                <div class="product-content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                        <div style="font-weight: 700; font-size: 16px;">
                           <span id="productCountDisplay">Loading...</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-primary" onclick="retailerApp.showAddProductModal()">+ Add Product</button>
                            <button class="btn btn-secondary" onclick="retailerApp.showCSVImportModal()">Import CSV</button>
                            <button class="btn btn-secondary" onclick="retailerApp.exportProducts()">Export</button>
                            <button class="btn btn-primary" style="background: #e91e63; border-color: #e91e63;" onclick="retailerApp.generateStaticCatalog()">🌍 24/7 Backup Catalog</button>
                            <button class="btn btn-secondary" style="background: #333; color: white; border-color: #333;" onclick="retailerApp.syncToGitHub()">☁️ Sync to GitHub</button>
                        </div>
                    </div>

                    <!-- PERMANENT STATUS BAR -->
                    <div id="tunnelStatusContainer" style="margin-bottom: 20px; background: #e8f5e9; border: 1px solid #c8e6c9; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;">🌐</span>
                            <div>
                                <div style="font-weight: 800; color: #2e7d32; font-size: 14px;">ALWAYS-ON SHOP LINK</div>
                                <div id="tunnelLinkDisplay" style="font-family: monospace; font-size: 16px; color: #1b5e20;">Loading Link...</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                             <div style="font-size: 11px; font-weight: 700; color: #e65100;">GUEST CODE (If Asked):</div>
                             <div id="guestCodeDisplay" style="font-family: monospace; font-size: 18px; font-weight: 800; background: white; padding: 2px 8px; border-radius: 4px; border: 1px solid #ffcc80;">...</div>
                        </div>
                    </div>
                    
                    <div id="productsGridContainer">
                        ${html}
                    </div>
                </div>
            </div>
        </div>
    `;
};

RetailerApp.prototype.generateFilterSidebar = function () {
    const products = dataManager.getProducts();
    const categories = [...new Set(products.map(p => p.category))].sort();
    const brands = [...new Set(products.map(p => p.brand))].sort();

    return `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div class="filter-group">
                <label style="display: block; font-weight: 700; margin-bottom: 8px;">🔍 Search</label>
                <input type="text" placeholder="Name, brand, ID..." 
                       value="${this.productFilters.search}"
                       oninput="retailerApp.productFilters.search = this.value; retailerApp.productPagination.page = 1; retailerApp.refreshProductsList()"
                       style="width: 100%; padding: 10px; border: 2px solid black; border-radius: 6px;">
            </div>

            <div class="filter-group">
                <label style="display: block; font-weight: 700; margin-bottom: 8px;">📂 Category</label>
                <select onchange="retailerApp.productFilters.category = this.value; retailerApp.productPagination.page = 1; retailerApp.refreshProductsList()"
                        style="width: 100%; padding: 10px; border: 2px solid black; border-radius: 6px;">
                    <option value="all">All Categories</option>
                    ${categories.map(c => `<option value="${c}" ${this.productFilters.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>

            <div class="filter-group">
                <label style="display: block; font-weight: 700; margin-bottom: 8px;">🏷️ Brand</label>
                <select onchange="retailerApp.productFilters.brand = this.value; retailerApp.productPagination.page = 1; retailerApp.refreshProductsList()"
                        style="width: 100%; padding: 10px; border: 2px solid black; border-radius: 6px;">
                    <option value="all">All Brands</option>
                    ${brands.map(b => `<option value="${b}" ${this.productFilters.brand === b ? 'selected' : ''}>${b}</option>`).join('')}
                </select>
            </div>

            <div class="filter-group">
                <label style="display: block; font-weight: 700; margin-bottom: 8px;">📦 Stock Status</label>
                <select onchange="retailerApp.productFilters.stockStatus = this.value; retailerApp.productPagination.page = 1; retailerApp.refreshProductsList()"
                        style="width: 100%; padding: 10px; border: 2px solid black; border-radius: 6px;">
                    <option value="all" ${this.productFilters.stockStatus === 'all' ? 'selected' : ''}>All Status</option>
                    <option value="in-stock" ${this.productFilters.stockStatus === 'in-stock' ? 'selected' : ''}>In Stock</option>
                    <option value="low-stock" ${this.productFilters.stockStatus === 'low-stock' ? 'selected' : ''}>Low Stock (≤10)</option>
                    <option value="out-of-stock" ${this.productFilters.stockStatus === 'out-of-stock' ? 'selected' : ''}>Out of Stock</option>
                </select>
            </div>

             <div class="filter-group">
                <label style="display: block; font-weight: 700; margin-bottom: 8px;">💰 Price Range</label>
                <div style="display: flex; gap: 8px;">
                    <input type="number" placeholder="Min" value="${this.productFilters.minPrice}" 
                           oninput="retailerApp.productFilters.minPrice = this.value; retailerApp.productPagination.page = 1; retailerApp.refreshProductsList()"
                           style="width: 50%; padding: 8px; border: 2px solid black; border-radius: 6px;">
                    <input type="number" placeholder="Max" value="${this.productFilters.maxPrice}" 
                           oninput="retailerApp.productFilters.maxPrice = this.value; retailerApp.productPagination.page = 1; retailerApp.refreshProductsList()"
                           style="width: 50%; padding: 8px; border: 2px solid black; border-radius: 6px;">
                </div>
            </div>

            <div class="filter-group">
                <label style="display: block; font-weight: 700; margin-bottom: 8px;">Sort By</label>
                <select onchange="retailerApp.productFilters.sortBy = this.value; retailerApp.refreshProductsList()"
                        style="width: 100%; padding: 10px; border: 2px solid black; border-radius: 6px;">
                    <option value="name-asc" ${this.productFilters.sortBy === 'name-asc' ? 'selected' : ''}>Name (A-Z)</option>
                    <option value="name-desc" ${this.productFilters.sortBy === 'name-desc' ? 'selected' : ''}>Name (Z-A)</option>
                    <option value="price-asc" ${this.productFilters.sortBy === 'price-asc' ? 'selected' : ''}>Price (Low-High)</option>
                    <option value="price-desc" ${this.productFilters.sortBy === 'price-desc' ? 'selected' : ''}>Price (High-Low)</option>
                    <option value="stock-asc" ${this.productFilters.sortBy === 'stock-asc' ? 'selected' : ''}>Stock (Low-High)</option>
                    <option value="stock-desc" ${this.productFilters.sortBy === 'stock-desc' ? 'selected' : ''}>Stock (High-Low)</option>
                </select>
            </div>
            
            <button class="btn btn-secondary" style="width: 100%; margin-top: 12px;" 
                    onclick="retailerApp.productFilters = null; retailerApp.productPagination.page = 1; retailerApp.render();">
                Reset Filters
            </button>
        </div>
    `;
};

RetailerApp.prototype.generateProductsContent = function () {
    let products = dataManager.getProducts();
    const settings = dataManager.getSettings();

    // 1. Filter
    if (this.productFilters) {
        if (this.productFilters.search) {
            const term = this.productFilters.search.toLowerCase();
            products = products.filter(p => p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term));
        }
        if (this.productFilters.category !== 'all') {
            products = products.filter(p => p.category === this.productFilters.category);
        }
        if (this.productFilters.brand !== 'all') {
            products = products.filter(p => p.brand === this.productFilters.brand);
        }
        if (this.productFilters.stockStatus === 'in-stock') products = products.filter(p => p.stock > 0);
        if (this.productFilters.stockStatus === 'low-stock') products = products.filter(p => p.stock <= settings.lowStockThreshold && p.stock > 0);
        if (this.productFilters.stockStatus === 'out-of-stock') products = products.filter(p => p.stock === 0);

        if (this.productFilters.minPrice) products = products.filter(p => p.prices[0].price >= parseInt(this.productFilters.minPrice));
        if (this.productFilters.maxPrice) products = products.filter(p => p.prices[0].price <= parseInt(this.productFilters.maxPrice));
    }

    // 2. Sort
    switch (this.productFilters?.sortBy) {
        case 'name-asc': products.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'name-desc': products.sort((a, b) => b.name.localeCompare(a.name)); break;
        case 'price-asc': products.sort((a, b) => a.prices[0].price - b.prices[0].price); break;
        case 'price-desc': products.sort((a, b) => b.prices[0].price - a.prices[0].price); break;
        case 'stock-asc': products.sort((a, b) => a.stock - b.stock); break;
        case 'stock-desc': products.sort((a, b) => b.stock - a.stock); break;
    }

    const totalProducts = products.length;

    // Update Count Display (Soft Update Helper)
    setTimeout(() => {
        const el = document.getElementById('productCountDisplay');
        if (el) el.innerText = `${totalProducts} Products Found`;
    }, 0);

    // 3. Paginate
    const page = this.productPagination.page;
    const limit = this.productPagination.limit;
    const totalPages = Math.ceil(totalProducts / limit);

    if (page > totalPages && totalPages > 0) this.productPagination.page = totalPages;

    const start = (this.productPagination.page - 1) * limit;
    const paginatedProducts = products.slice(start, start + limit);

    if (totalProducts === 0) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <div class="empty-state-text">No products match your filters</div>
            </div>
        `;
    }

    return `
        <div class="table-container" style="overflow-x: auto; min-height: 400px;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Product Details</th>
                        <th>Measure</th>
                        <th>Category</th>
                        <th>Stock Status</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${paginatedProducts.map(p => `
                        <tr>
                            <td>
                                <div style="width: 44px; height: 44px; background: white; border: 1px solid black; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 2px;">
                                    <img src="${p.image}" alt="" style="max-width: 100%; max-height: 100%; object-fit: contain;"
                                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(p.brand + '+' + p.name)}&background=ffffff&color=000000&size=64&bold=true&format=svg'">
                                </div>
                            </td>
                            <td>
                                <div style="font-weight: 700; color: black;">${p.baseName || p.name.split(' (')[0]}</div>
                                <div style="font-size: 11px; color: #1a1a1a; font-weight: 600;">Brand: ${p.brand}</div>
                                <div style="font-size: 10px; color: #666;">ID: ${p.id}</div>
                            </td>
                            <td style="font-weight: 700; color: #2ecc71;">${p.measureValue || '1'}${p.measureUnit || 'Unit'}</td>
                            <td>${p.category}</td>
                            <td>
                                <span style="background: ${p.stock === 0 ? '#ff1744' : (p.stock <= settings.lowStockThreshold ? '#ffeb3b' : '#00c853')}; 
                                             color: ${p.stock <= settings.lowStockThreshold && p.stock > 0 ? 'black' : 'white'}; 
                                             padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 12px; border: 1px solid black;">
                                    ${p.stock}
                                </span>
                            </td>
                            <td style="font-weight: 700; color: black;">₹${Math.round(p.prices[0].price)}</td>
                            <td>
                                <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" onclick="retailerApp.editProduct('${p.id}')">Edit</button>
                                <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px; margin-left: 4px;" onclick="retailerApp.deleteProduct('${p.id}')">Del</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="pagination-controls" style="display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 24px;">
            <button class="btn btn-secondary" 
                    ${this.productPagination.page === 1 ? 'disabled' : ''}
                    onclick="retailerApp.changeProductPage(-1)">
                ◀ Prev
            </button>
            <span style="font-weight: 700;">Page ${this.productPagination.page} of ${totalPages}</span>
            <button class="btn btn-secondary" 
                    ${this.productPagination.page >= totalPages ? 'disabled' : ''}
                    onclick="retailerApp.changeProductPage(1)">
                Next ▶
            </button>
        </div>
    `;
};

RetailerApp.prototype.refreshProductsList = function () {
    document.getElementById('productsGridContainer').innerHTML = this.generateProductsContent();
};

RetailerApp.prototype.changeProductPage = function (delta) {
    this.productPagination.page += delta;
    this.refreshProductsList();
};

RetailerApp.prototype.adjustStock = function (productId, delta) {
    const product = dataManager.getProductById(productId);
    if (!product) return;

    const newStock = Math.max(0, product.stock + delta);
    dataManager.updateProduct(productId, { stock: newStock });
    this.render(); // This will trigger a full re-render, keeping the new architecture safe
};

RetailerApp.prototype.adjustPrice = function (productId, delta) {
    const product = dataManager.getProductById(productId);
    if (!product) return;

    const defaultPrice = product.prices.find(p => p.isDefault);
    if (!defaultPrice) return;

    defaultPrice.price = Math.max(1, Math.round(defaultPrice.price + delta));
    dataManager.updateProduct(productId, product);
    this.render();
};

RetailerApp.prototype.showAddProductModal = function () {
    this.modal = `
        <div class="modal-overlay" onclick="if(event.target === this) retailerApp.closeModal()">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>📦 Add New Product (Multi-Tier)</h2>
                    <button class="modal-close" onclick="retailerApp.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 240px 1fr; gap: 24px;">
                        <!-- IMAGE SECTION -->
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div id="productImagePreview" style="aspect-ratio: 1; border: 3px solid black; border-radius: 12px; background: #fff; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                                <img src="https://via.placeholder.com/200?text=No+Image" id="previewImg" style="width: 100%; height: 100%; object-fit: contain;">
                                <div id="imageLoader" style="display: none; position: absolute; inset: 0; background: rgba(255,255,255,0.8); align-items: center; justify-content: center;">
                                    <div class="loader"></div>
                                </div>
                            </div>
                            <button class="btn btn-secondary" onclick="document.getElementById('hiddenProductFile').click()" style="font-size: 11px;">📤 Upload from Device</button>
                            <input type="file" id="hiddenProductFile" style="display: none;" accept="image/*" onchange="retailerApp.handleImageUpload(event, 'previewImg', 'newProductImageURL')">
                        </div>

                        <!-- FORM SECTION -->
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <div class="form-group">
                                <label style="font-weight: 700;">Global Product Detail (Same for all Tiers)</label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="text" id="newProductBrand" placeholder="Brand (Amul)" style="flex: 0.4;" oninput="retailerApp.autoFillProductData(false)">
                                    <input type="text" id="newProductName" placeholder="Base Name (Milk)" style="flex: 1;" oninput="retailerApp.autoFillProductData(false)">
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label>Category</label>
                                    <input type="text" id="newProductCategory" placeholder="e.g., Groceries" oninput="retailerApp.autoFillProductData(false)">
                                </div>
                                <div class="form-group">
                                    <button class="btn btn-primary" onclick="retailerApp.autoFillProductData(true)" style="margin-top: 24px; width: 100%;">🔍 Smart Search</button>
                                </div>
                            </div>

                            <div style="border-top: 2px dashed #ddd; padding-top: 16px; margin-top: 8px;">
                                <label style="font-weight: 700; margin-bottom: 12px; display: block; display: flex; justify-content: space-between; align-items: center;">
                                    📊 Product Tiers (Measure & Price)
                                    <span style="font-size: 10px; color: #666;">Different prices for different weights</span>
                                </label>
                                <div id="tiersContainer">
                                    <div class="tier-row" style="display: grid; grid-template-columns: 80px 100px 100px 100px auto; gap: 12px; margin-bottom: 12px; align-items: end; padding: 10px; background: #f9f9f9; border-radius: 8px;">
                                        <div class="form-group">
                                            <label style="font-size: 10px; font-weight: 700;">Qty</label>
                                            <input type="text" class="tier-qty" value="1" style="padding: 8px;">
                                        </div>
                                        <div class="form-group">
                                            <label style="font-size: 10px; font-weight: 700;">Unit</label>
                                            <select class="tier-unit" style="padding: 8px; height: 38px;">
                                                <option value="gm">gm</option>
                                                <option value="kg">kg</option>
                                                <option value="ml">ml</option>
                                                <option value="L">L</option>
                                                <option value="Unit" selected>Unit</option>
                                                <option value="Pack">Pack</option>
                                                <option value="pc">pc</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label style="font-size: 10px; font-weight: 700;">Price (₹)</label>
                                            <input type="number" class="tier-price" value="10" min="1" style="padding: 8px;">
                                        </div>
                                        <div class="form-group">
                                            <label style="font-size: 10px; font-weight: 700;">Stock</label>
                                            <input type="number" class="tier-stock" value="10" min="0" style="padding: 8px;">
                                        </div>
                                        <button class="btn btn-danger" style="height: 38px; padding: 0 12px;" disabled>×</button>
                                    </div>
                                </div>
                                <button class="btn btn-secondary" style="width: 100%; border-style: dashed; padding: 10px;" onclick="retailerApp.addTierRow()">+ Add Another Measure/Weight Variant</button>
                            </div>

                            <div class="form-group">
                                <label style="display: flex; justify-content: space-between;">
                                    Image URL (Internet Verified)
                                    <button class="btn btn-secondary" style="padding: 2px 8px; font-size: 10px; height: auto;" onclick="retailerApp.searchImageWeb()">🌐 Search</button>
                                </label>
                                <input type="text" id="newProductImageURL" placeholder="Auto-filled link" oninput="document.getElementById('previewImg').src = this.value">
                            </div>

                            <div class="form-group">
                                <label style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="display: flex; gap: 8px; align-items: center;">
                                        GST Rate
                                        <button class="btn btn-secondary" style="padding: 2px 8px; font-size: 9px; height: auto;" onclick="const gi=document.getElementById('newProductGST'); gi.dataset.manual='false'; gi.style.borderColor='#ddd'; retailerApp.autoFillProductData(true)">🤖 AI Resolve</button>
                                    </div>
                                    <span id="gstStatus" style="font-size: 10px; color: #f39c12; font-weight: 700;">⚠ Smart Suggesting...</span>
                                </label>
                                <select id="newProductGST" style="background: #fff; border: 2px solid #ddd; font-weight: 700; height: 42px; width: 100%; border-radius: 8px; padding: 0 10px;" onchange="this.dataset.manual='true'; this.style.borderColor='#2ecc71'; document.getElementById('gstStatus').innerText='✓ Manually Set'">
                                    <option value="0">0% (Nil / Essential)</option>
                                    <option value="5">5% (Essential Drugs / Daily Foods)</option>
                                    <option value="12">12% (Branded Foods)</option>
                                    <option value="18" selected>18% (Standard Rate)</option>
                                    <option value="28">28% (Luxury / Aerated)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <button class="btn btn-success" style="width: 100%; padding: 16px; font-size: 18px; font-weight: 700; margin-top: 24px; box-shadow: 4px 4px 0px rgba(0,0,0,1);" 
                            onclick="retailerApp.saveNewProduct()">✅ Create and List All Variants</button>
                </div>
            </div>
        </div>
    `;
    this.render();
    this.autoFillProductData(false);
};

RetailerApp.prototype.addTierRow = function (qty = "1", unit = "Unit", price = "10", stock = "10") {
    const container = document.getElementById('tiersContainer');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'tier-row';
    div.style = 'display: grid; grid-template-columns: 80px 100px 100px 100px auto; gap: 12px; margin-bottom: 12px; align-items: end; padding: 10px; background: #f9f9f9; border-radius: 8px;';
    div.innerHTML = `
        <div class="form-group">
            <label style="font-size: 10px; font-weight: 700;">Qty</label>
            <input type="text" class="tier-qty" value="${qty}" style="padding: 8px;">
        </div>
        <div class="form-group">
            <label style="font-size: 10px; font-weight: 700;">Unit</label>
            <select class="tier-unit" style="padding: 8px; height: 38px;">
                <option value="gm" ${unit === 'gm' ? 'selected' : ''}>gm</option>
                <option value="kg" ${unit === 'kg' ? 'selected' : ''}>kg</option>
                <option value="ml" ${unit === 'ml' ? 'selected' : ''}>ml</option>
                <option value="L" ${unit === 'L' ? 'selected' : ''}>L</option>
                <option value="Unit" ${unit === 'Unit' ? 'selected' : ''}>Unit</option>
                <option value="Pack" ${unit === 'Pack' ? 'selected' : ''}>Pack</option>
                <option value="pc" ${unit === 'pc' ? 'selected' : ''}>pc</option>
            </select>
        </div>
        <div class="form-group">
            <label style="font-size: 10px; font-weight: 700;">Price (₹)</label>
            <input type="number" class="tier-price" value="${price}" min="1" style="padding: 8px;">
        </div>
        <div class="form-group">
            <label style="font-size: 10px; font-weight: 700;">Stock</label>
            <input type="number" class="tier-stock" value="${stock}" min="0" style="padding: 8px;">
        </div>
        <button class="btn btn-danger" style="height: 38px; padding: 0 12px;" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
};

RetailerApp.prototype.autoFillProductData = async function (isManual = false) {
    const nameInput = document.getElementById('newProductName') || document.getElementById('editProductName');
    const brandInput = document.getElementById('newProductBrand') || document.getElementById('editProductBrand');
    const categoryInput = document.getElementById('newProductCategory') || document.getElementById('editProductCategory');
    const loader = document.getElementById('imageLoader');
    const previewImg = document.getElementById('previewImg');
    const urlInput = document.getElementById('newProductImageURL') || document.getElementById('editProductImage');

    const name = nameInput?.value?.trim();
    const brand = brandInput?.value?.trim();
    const category = categoryInput?.value?.trim();
    const priceInput = document.getElementById('newProductPrice') || document.getElementById('editProductPrice');
    const price = priceInput?.value || 0;

    if (!name && !brand) return; // Need at least one to start, but preference is both for search. 
    // GST can still recalculate based on Name + Price even if Search isn't triggered.

    if (loader) loader.style.display = 'flex';

    // 1. Fetch Real Market Image from DataManager (Category-aware for niche results)
    const imageURL = await dataManager.fetchProductImage(name, brand, category);
    if (imageURL) {
        if (previewImg) previewImg.src = imageURL;
        if (urlInput) {
            urlInput.value = imageURL;
            urlInput.dataset.uploaded = ""; // Reset local upload if we auto-fill
        }
    }

    // 2. Auto-calculate GST (Internet-First Search Intelligence)
    const gstInput = document.getElementById('newProductGST') || document.getElementById('editProductGST');
    const gstBadge = document.getElementById('gstStatus');

    if (gstInput && gstInput.dataset.manual !== "true") {
        // Try Live Internet Intelligence First (Never Outdated)
        let gst = await dataManager.resolveGSTIntelligence(name, brand, category);
        let gstExplanation = gst ? `Internet Resolved (${gst}%)` : "";

        // Fallback to Local Knowledge Base if Internet is silent
        if (gst === null) {
            gst = dataManager.getGSTRate(name || "", category || "", price, brand || "");
            gstExplanation = dataManager.getGSTExplanation(name || "", category || "", price, brand || "");
        }

        if (gst === -1) {
            gstInput.value = "18"; // Default fallback
            if (gstBadge) {
                gstBadge.innerText = "⚠ Pending Price Classification";
                gstBadge.style.color = "#f39c12";
            }
        } else {
            gstInput.value = gst;
            if (gstBadge) {
                gstBadge.innerText = "✓ " + gstExplanation;
                gstBadge.style.color = "#2ecc71";
            }
        }
    }

    if (loader) loader.style.display = 'none';
};

RetailerApp.prototype.searchImageWeb = function () {
    const name = (document.getElementById('newProductName') || document.getElementById('editProductName'))?.value?.trim();
    const brand = (document.getElementById('newProductBrand') || document.getElementById('editProductBrand'))?.value?.trim();
    if (!name && !brand) {
        alert('Please enter Name and Brand first to search.');
        return;
    }
    const query = encodeURIComponent(`${brand} ${name} product packaging real image price india`).replace(/%20/g, '+');
    window.open(`https://www.google.com/search?q=${query}&tbm=isch`, '_blank');
};

RetailerApp.prototype.handleImageUpload = async function (event, previewId, inputId) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const dataURL = await dataManager.processImageUpload(file);
        document.getElementById(previewId).src = dataURL;
        const input = document.getElementById(inputId);
        input.value = "Local Uploaded Image";
        input.dataset.uploaded = dataURL;
    } catch (e) {
        alert("Failed to process image.");
    }
};

RetailerApp.prototype.saveNewProduct = function () {
    const baseName = document.getElementById('newProductName').value.trim();
    const brand = document.getElementById('newProductBrand').value.trim();
    const category = document.getElementById('newProductCategory').value.trim();
    const urlInput = document.getElementById('newProductImageURL');
    const imageURL = urlInput.dataset.uploaded || urlInput.value.trim();
    const gst = parseInt(document.getElementById('newProductGST').value) || 18;

    const tierRows = document.querySelectorAll('.tier-row');

    if (!baseName || !brand || !category) {
        alert('Please fill at least Brand, Name and Category');
        return;
    }

    tierRows.forEach(row => {
        const qty = row.querySelector('.tier-qty').value;
        const unit = row.querySelector('.tier-unit').value;
        const price = parseInt(row.querySelector('.tier-price').value) || 0;
        const stock = parseInt(row.querySelector('.tier-stock').value) || 0;

        const finalName = `${baseName} (${qty}${unit})`;
        const product = {
            name: finalName,
            baseName: baseName, // Used for grouped editing
            brand,
            category,
            stock,
            gst,
            measureValue: qty,
            measureUnit: unit,
            image: imageURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(brand + '+' + baseName)}&background=ffffff&color=000000&size=512&bold=true&format=svg`,
            prices: [
                { quantity: 1, price, isDefault: true }
            ]
        };
        dataManager.addProduct(product);
    });

    alert(`Successfully added ${tierRows.length} variants!`);
    this.closeModal();
};

RetailerApp.prototype.editProduct = function (productId) {
    const product = dataManager.getProductById(productId);
    if (!product) return;

    // Find all variants of this product (same brand and baseName)
    const variants = dataManager.getProducts().filter(p =>
        p.brand === product.brand &&
        (p.baseName === (product.baseName || product.name.split(' (')[0]))
    );

    this.modal = `
        <div class="modal-overlay" onclick="if(event.target === this) retailerApp.closeModal()">
            <div class="modal-content" style="max-width: 850px;">
                <div class="modal-header">
                    <h2>✏️ Edit Product Group (Variants)</h2>
                    <button class="modal-close" onclick="retailerApp.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 200px 1fr; gap: 24px;">
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div id="productImagePreview" style="aspect-ratio: 1; border: 3px solid black; border-radius: 12px; background: #fff; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                                <img src="${product.image}" id="previewImg" style="width: 100%; height: 100%; object-fit: contain;">
                                <div id="imageLoader" style="display: none; position: absolute; inset: 0; background: rgba(255,255,255,0.8); align-items: center; justify-content: center;">
                                    <div class="loader"></div>
                                </div>
                            </div>
                            <button class="btn btn-secondary" onclick="document.getElementById('hiddenProductFile').click()" style="font-size: 11px;">📤 Replace Image</button>
                            <input type="file" id="hiddenProductFile" style="display: none;" accept="image/*" onchange="retailerApp.handleImageUpload(event, 'previewImg', 'editProductImage')">
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <div class="form-group" style="padding: 12px; background: #f0f0f0; border: 2px solid black; border-radius: 8px;">
                                <label style="font-weight: 700; color: #ff1744;">Group Identity (Affects All Variants)</label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="text" id="editProductBrand" value="${product.brand}" style="flex: 0.4;" oninput="retailerApp.autoFillProductData(false)">
                                    <input type="text" id="editProductName" value="${product.baseName || product.name.split(' (')[0]}" style="flex: 1;" oninput="retailerApp.autoFillProductData(false)">
                                </div>
                                <div style="margin-top: 10px;">
                                    <label style="font-size: 11px;">Category</label>
                                    <input type="text" id="editProductCategory" value="${product.category}" oninput="retailerApp.autoFillProductData(false)">
                                </div>
                            </div>

                            <div style="border-top: 2px dashed #ddd; padding-top: 16px;">
                                <label style="font-weight: 700; display: block; margin-bottom: 12px;">📈 Variants (Measures & Prices)</label>
                                <div id="tiersContainer">
                                    ${variants.map(v => `
                                        <div class="tier-row" data-product-id="${v.id}" style="display: grid; grid-template-columns: 80px 100px 100px 100px auto; gap: 10px; margin-bottom: 10px; align-items: end; padding: 10px; background: #fff; border: 2px solid #ddd; border-radius: 8px;">
                                            <div class="form-group">
                                                <label style="font-size: 10px;">Qty</label>
                                                <input type="text" class="tier-qty" value="${v.measureValue || ''}" style="padding: 6px;">
                                            </div>
                                            <div class="form-group">
                                                <label style="font-size: 10px;">Unit</label>
                                                <select class="tier-unit" style="padding: 6px;">
                                                    <option value="gm" ${v.measureUnit === 'gm' ? 'selected' : ''}>gm</option>
                                                    <option value="kg" ${v.measureUnit === 'kg' ? 'selected' : ''}>kg</option>
                                                    <option value="ml" ${v.measureUnit === 'ml' ? 'selected' : ''}>ml</option>
                                                    <option value="L" ${v.measureUnit === 'L' ? 'selected' : ''}>L</option>
                                                    <option value="Unit" ${v.measureUnit === 'Unit' ? 'selected' : ''}>Unit</option>
                                                    <option value="Pack" ${v.measureUnit === 'Pack' ? 'selected' : ''}>Pack</option>
                                                    <option value="pc" ${v.measureUnit === 'pc' ? 'selected' : ''}>pc</option>
                                                </select>
                                            </div>
                                            <div class="form-group">
                                                <label style="font-size: 10px;">Price</label>
                                                <input type="number" class="tier-price" value="${v.prices[0].price}" style="padding: 6px;">
                                            </div>
                                            <div class="form-group">
                                                <label style="font-size: 10px;">Stock</label>
                                                <input type="number" class="tier-stock" value="${v.stock}" style="padding: 6px;">
                                            </div>
                                            <button class="btn btn-danger" onclick="retailerApp.deleteVariantRow(this, '${v.id}')" style="padding: 4px 8px;">×</button>
                                        </div>
                                    `).join('')}
                                </div>
                                <button class="btn btn-secondary" style="width: 100%; border-style: dashed;" onclick="retailerApp.addTierRow()">+ Add New Variant Measure</button>
                            </div>

                            <div class="form-group">
                                <label style="display: flex; justify-content: space-between;">
                                    Group Image URL
                                    <button class="btn btn-secondary" style="padding: 2px 8px; font-size: 10px; height: auto;" onclick="retailerApp.searchImageWeb()">🌐 Search</button>
                                </label>
                                <input type="text" id="editProductImage" value="${product.image.startsWith('data:') ? 'Local Uploaded Image' : product.image}" oninput="document.getElementById('previewImg').src = this.value">
                            </div>
                            
                            <div class="form-group">
                                 <label style="display: flex; justify-content: space-between;">
                                     <div style="display: flex; gap: 8px; align-items: center; font-weight: 700;">GST %</div>
                                     <span id="gstStatus" style="font-size: 10px; color: #2ecc71; font-weight: 700;">✓ Active</span>
                                 </label>
                                 <select id="editProductGST" style="background: #fff; border: 2px solid #ddd; font-weight: 700; height: 40px; width: 100%; border-radius: 8px; padding: 0 10px;">
                                     <option value="0" ${product.gst == 0 ? 'selected' : ''}>0% (Exempt)</option>
                                     <option value="5" ${product.gst == 5 ? 'selected' : ''}>5% (Medicine/Daily)</option>
                                     <option value="12" ${product.gst == 12 ? 'selected' : ''}>12% (Processed)</option>
                                     <option value="18" ${product.gst == 18 ? 'selected' : ''}>18% (Standard)</option>
                                     <option value="28" ${product.gst == 28 ? 'selected' : ''}>28% (Luxury)</option>
                                 </select>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-success" style="width: 100%; padding: 16px; font-size: 18px; font-weight: 700; margin-top: 24px; box-shadow: 4px 4px 0px rgba(0,0,0,1);" 
                            onclick="retailerApp.saveEditedProductGroup()">💾 Save All Group Variations</button>
                </div>
            </div>
        </div>
    `;
    this.render();
};

RetailerApp.prototype.deleteVariantRow = function (btn, productId) {
    if (confirm('Permanently delete this variant from inventory?')) {
        dataManager.deleteProduct(productId);
        btn.parentElement.remove();
    }
};

RetailerApp.prototype.saveEditedProductGroup = function () {
    const baseName = document.getElementById('editProductName').value.trim();
    const brand = document.getElementById('editProductBrand').value.trim();
    const category = document.getElementById('editProductCategory').value.trim();
    const gst = parseInt(document.getElementById('editProductGST').value) || 18;
    const urlInput = document.getElementById('editProductImage');
    const imageURL = urlInput.dataset.uploaded || urlInput.value.trim();

    const tierRows = document.querySelectorAll('.tier-row');

    tierRows.forEach(row => {
        const productId = row.dataset.productId;
        const qty = row.querySelector('.tier-qty').value;
        const unit = row.querySelector('.tier-unit').value;
        const price = parseInt(row.querySelector('.tier-price').value) || 0;
        const stock = parseInt(row.querySelector('.tier-stock').value) || 0;

        const finalName = `${baseName} (${qty}${unit})`;
        const updates = {
            name: finalName,
            baseName,
            brand,
            category,
            gst,
            stock,
            measureValue: qty,
            measureUnit: unit,
            image: imageURL === "Local Uploaded Image" ? (productId ? dataManager.getProductById(productId).image : "") : imageURL,
            prices: [{ quantity: 1, price, isDefault: true }]
        };

        if (productId) {
            dataManager.updateProduct(productId, updates);
        } else {
            // New variant added in edit modal
            dataManager.addProduct(updates);
        }
    });

    alert('Product Group updated successfully!');
    this.closeModal();
};

RetailerApp.prototype.saveEditedProduct = function (productId) {
    const urlInput = document.getElementById('editProductImage');
    const imageURL = urlInput.dataset.uploaded || urlInput.value.trim();

    const updates = {
        name: document.getElementById('editProductName').value.trim(),
        brand: document.getElementById('editProductBrand').value.trim(),
        category: document.getElementById('editProductCategory').value.trim(),
        stock: parseInt(document.getElementById('editProductStock').value) || 0,
        image: imageURL === "Local Uploaded Image" ? dataManager.getProductById(productId).image : imageURL
    };

    const product = dataManager.getProductById(productId);
    const defaultPrice = product.prices.find(p => p.isDefault);
    defaultPrice.price = parseInt(document.getElementById('editProductPrice').value) || 10;

    updates.prices = product.prices;
    updates.gst = parseInt(document.getElementById('editProductGST').value) || 18;

    dataManager.updateProduct(productId, updates);
    alert('Product updated successfully!');
    this.closeModal();
};

RetailerApp.prototype.deleteProduct = function (productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        dataManager.deleteProduct(productId);
        this.render();
    }
};

RetailerApp.prototype.showCSVImportModal = function () {
    this.modal = `
        <div class="modal-overlay" onclick="if(event.target === this) retailerApp.closeModal()">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Import Products from CSV</h2>
                    <button class="modal-close" onclick="retailerApp.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="alert-box info" style="margin-bottom: 16px;">
                        <strong>CSV Format:</strong> name, brand, category, stock, price<br>
                        <strong>Example:</strong> Tata Salt, Tata, Groceries, 50, 20
                    </div>
                    <div class="file-upload-area" onclick="document.getElementById('csvFileInput').click()">
                        <div class="upload-icon">📄</div>
                        <div class="upload-text">Click to select CSV file</div>
                        <input type="file" id="csvFileInput" accept=".csv" onchange="retailerApp.handleCSVUpload(event)">
                    </div>
                </div>
            </div>
        </div>
    `;
    this.render();
};

RetailerApp.prototype.handleCSVUpload = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const csvText = e.target.result;
        const imported = dataManager.importFromCSV(csvText);

        let successCount = 0;
        for (const row of imported) {
            if (row.name && row.brand && row.category) {
                const product = {
                    name: row.name,
                    brand: row.brand,
                    category: row.category,
                    stock: parseInt(row.stock) || 0,
                    gst: dataManager.getGSTRate(row.name, row.category),
                    image: `https://via.placeholder.com/200x200/ffffff/000000?text=${encodeURIComponent(row.name)}`,
                    prices: [{ quantity: 1, price: parseInt(row.price) || 10, isDefault: true }]
                };
                dataManager.addProduct(product);
                successCount++;
            }
        }

        alert(`Successfully imported ${successCount} products!`);
        this.closeModal();
    };
    reader.readAsText(file);
};

RetailerApp.prototype.exportProducts = function () {
    const products = dataManager.getProducts();
    const data = products.map(p => ({
        name: p.name,
        brand: p.brand,
        category: p.category,
        stock: p.stock,
        price: p.prices.find(pr => pr.isDefault).price,
        gst: p.gst
    }));
    dataManager.exportToCSV(data, 'products.csv');
};

// ============================================
// OFFERS MANAGEMENT
// ============================================

RetailerApp.prototype.renderOffers = function () {
    if (!this.offerFilters) this.offerFilters = { search: '' };
    const html = this.generateOffersHTML();

    return `
        <div class="retailer-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="font-size: 24px; font-weight: 700; color: black;">🎁 Offers & Discounts</h2>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <input type="text" placeholder="Search offers..." 
                           value="${this.offerFilters.search}"
                           oninput="retailerApp.offerFilters.search = this.value; retailerApp.refreshOffersList()"
                           style="padding: 8px; border: 2px solid black; border-radius: 6px; width: 250px;">
                    <button class="btn btn-primary" onclick="retailerApp.showCreateOfferModal()">+ Create Offer</button>
                </div>
            </div>

            <div id="offersListContainer">
                 ${html}
            </div>
        </div>
    `;
};

RetailerApp.prototype.refreshOffersList = function () {
    document.getElementById('offersListContainer').innerHTML = this.generateOffersHTML();
};

RetailerApp.prototype.generateOffersHTML = function () {
    let offers = dataManager.getOffers();

    if (this.offerFilters.search) {
        const term = this.offerFilters.search.toLowerCase();
        offers = offers.filter(o => o.name.toLowerCase().includes(term));
    }

    if (offers.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">🎁</div>
                <div class="empty-state-text">No offers found</div>
            </div>
        `;
    }

    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Offer Name</th>
                    <th>Type</th>
                    <th>Discount</th>
                    <th>Min Qty</th>
                    <th>Valid Until</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${offers.map(offer => `
                    <tr>
                        <td style="font-weight: 700; color: black;">${offer.name}</td>
                        <td>${offer.type.toUpperCase()}</td>
                        <td style="font-weight: 700; color: black;">
                            ${offer.type === 'percentage' || offer.type === 'bulk' ? offer.discountValue + '%' :
            offer.type === 'fixed' ? '₹' + offer.discountValue :
                offer.type === 'bogo' ? `Buy ${offer.buyQuantity} Get ${offer.getQuantity}` :
                    offer.discountValue + '%'}
                        </td>
                        <td>${offer.minQuantity || '-'}</td>
                        <td>${new Date(offer.endDate).toLocaleDateString()}</td>
                        <td>
                            <span class="badge ${offer.active ? 'success' : 'danger'}">
                                ${offer.active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; margin-right: 4px;" 
                                    onclick="retailerApp.toggleOffer('${offer.id}')">
                                ${offer.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;" 
                                    onclick="retailerApp.deleteOffer('${offer.id}')">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
};

RetailerApp.prototype.showCreateOfferModal = function () {
    const products = dataManager.getProducts();
    const categories = [...new Set(products.map(p => p.category))];

    this.modal = `
        <div class="modal-overlay" onclick="if(event.target === this) retailerApp.closeModal()">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Create New Offer</h2>
                    <button class="modal-close" onclick="retailerApp.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Offer Name</label>
                        <input type="text" id="offerName" placeholder="e.g., Summer Sale">
                    </div>
                    
                    <div class="form-group">
                        <label>Smart Offer Preset</label>
                        <select id="offerPreset" onchange="retailerApp.applyOfferPreset()">
                            <option value="">-- Select Preset --</option>
                            <option value="percentage">Percentage Off</option>
                            <option value="fixed">Fixed Amount Off</option>
                            <option value="bogo">Buy One Get One (BOGO)</option>
                            <option value="bulk">Bulk Discount</option>
                            <option value="welcome">Welcome Offer (First Purchase)</option>
                            <option value="festival">Festival Special</option>
                            <option value="clearance">Clearance Sale</option>
                            <option value="combo">Combo Deal</option>
                            <option value="seasonal">Seasonal Discount</option>
                            <option value="loyalty">Loyalty Reward</option>
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Discount Value</label>
                            <input type="number" id="offerDiscount" placeholder="e.g., 10" min="0">
                            <small style="color: #1a1a1a;" id="discountHint">Enter percentage or amount</small>
                        </div>
                        <div class="form-group">
                            <label>Minimum Quantity</label>
                            <input type="number" id="offerMinQty" value="1" min="1">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Apply To</label>
                        <select id="offerApplication" onchange="retailerApp.toggleOfferScope()">
                            <option value="all">All Products</option>
                            <option value="category">Specific Category</option>
                            <option value="product">Specific Products</option>
                        </select>
                    </div>

                    <div class="form-group" id="categorySelect" style="display: none;">
                        <label>Select Category</label>
                        <select id="offerCategory">
                            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-group" id="productSelect" style="display: none;">
                        <label>Select Products (Multi-select)</label>
                        <div style="max-height: 150px; overflow-y: auto; border: 2px solid black; padding: 10px; border-radius: 8px;">
                            ${products.map(p => `
                                <div style="margin-bottom: 6px;">
                                    <input type="checkbox" name="offerProducts" value="${p.id}" id="prod_${p.id}">
                                    <label for="prod_${p.id}">${p.name} (${p.brand})</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Start Date</label>
                            <input type="date" id="offerStartDate" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label>End Date</label>
                            <input type="date" id="offerEndDate" value="${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}">
                        </div>
                    </div>

                    <button class="btn btn-success" style="width: 100%; padding: 14px; font-size: 16px; font-weight: 700;" 
                            onclick="retailerApp.saveOffer()">Create Offer</button>
                </div>
            </div>
        </div>
    `;
    this.render();
};

RetailerApp.prototype.toggleOfferScope = function () {
    const scope = document.getElementById('offerApplication').value;
    document.getElementById('categorySelect').style.display = scope === 'category' ? 'block' : 'none';
    document.getElementById('productSelect').style.display = scope === 'product' ? 'block' : 'none';
};

RetailerApp.prototype.applyOfferPreset = function () {
    const preset = document.getElementById('offerPreset').value;
    const discountInput = document.getElementById('offerDiscount');
    const minQtyInput = document.getElementById('offerMinQty');
    const nameInput = document.getElementById('offerName');
    const hint = document.getElementById('discountHint');

    switch (preset) {
        case 'percentage':
            discountInput.value = 10;
            minQtyInput.value = 1;
            nameInput.value = 'Percentage Discount';
            hint.textContent = 'Enter percentage (e.g., 10 for 10% off)';
            break;
        case 'fixed':
            discountInput.value = 50;
            minQtyInput.value = 1;
            nameInput.value = 'Fixed Discount';
            hint.textContent = 'Enter amount in ₹';
            break;
        case 'bogo':
            discountInput.value = 1;
            minQtyInput.value = 2;
            nameInput.value = 'Buy 1 Get 1 Free';
            hint.textContent = 'Buy quantity in min qty, get quantity in discount';
            break;
        case 'bulk':
            discountInput.value = 15;
            minQtyInput.value = 5;
            nameInput.value = 'Bulk Discount';
            hint.textContent = 'Percentage off for bulk purchase';
            break;
        case 'welcome':
            discountInput.value = 20;
            minQtyInput.value = 1;
            nameInput.value = 'Welcome Offer';
            hint.textContent = 'First purchase discount %';
            break;
        case 'festival':
            discountInput.value = 25;
            minQtyInput.value = 1;
            nameInput.value = 'Festival Special';
            hint.textContent = 'Festival discount %';
            break;
        case 'clearance':
            discountInput.value = 40;
            minQtyInput.value = 1;
            nameInput.value = 'Clearance Sale';
            hint.textContent = 'Clearance discount %';
            break;
    }
};

RetailerApp.prototype.saveOffer = function () {
    const name = document.getElementById('offerName').value.trim();
    const preset = document.getElementById('offerPreset').value || 'percentage';
    const discountValue = parseFloat(document.getElementById('offerDiscount').value) || 0;
    const minQuantity = parseInt(document.getElementById('offerMinQty').value) || 1;
    const applicationType = document.getElementById('offerApplication').value;
    const startDate = document.getElementById('offerStartDate').value;
    const endDate = document.getElementById('offerEndDate').value;

    let selectedProducts = [];
    if (applicationType === 'product') {
        const checkboxes = document.querySelectorAll('input[name="offerProducts"]:checked');
        selectedProducts = Array.from(checkboxes).map(cb => cb.value);
        if (selectedProducts.length === 0) {
            alert('Please select at least one product');
            return;
        }
    }

    if (!name || discountValue <= 0) {
        alert('Please fill all required fields');
        return;
    }

    const offer = {
        name,
        type: preset,
        discountValue,
        minQuantity,
        applicationType,
        categories: applicationType === 'category' ? [document.getElementById('offerCategory').value] : [],
        productIds: selectedProducts,
        buyQuantity: preset === 'bogo' ? minQuantity : 1,
        getQuantity: preset === 'bogo' ? discountValue : 0,
        startDate,
        endDate,
        active: true
    };

    dataManager.addOffer(offer);
    alert('Offer created successfully!');
    this.closeModal();
};

RetailerApp.prototype.toggleOffer = function (offerId) {
    const offer = dataManager.getOffers().find(o => o.id === offerId);
    if (offer) {
        dataManager.updateOffer(offerId, { active: !offer.active });
        this.render();
    }
};

RetailerApp.prototype.deleteOffer = function (offerId) {
    if (confirm('Are you sure you want to delete this offer?')) {
        dataManager.deleteOffer(offerId);
        this.render();
    }
};

// ============================================
// STATIC CATALOG GENERATOR (24/7 OFFLINE MODE)
// ============================================

RetailerApp.prototype.generateStaticCatalog = function () {
    if (!confirm('Generate "Use-Anywhere" Static Catalog?\n\nThis will create a standalone HTML file that works without any server. You can upload this to GitHub Pages or Netlify for free 24/7 hosting.')) return;

    const products = dataManager.getProducts();
    const shop = dataManager.getShopInfo();
    const shopPhone = shop.phone.replace(/\D/g, ''); // Digits only

    // BUILD THE STANDALONE HTML
    // We are injecting the ENTIRE product database as a JSON string into the file.
    // The file will have its own micro-engine to render cards and search.

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${shop.name} - 24/7 Offline Catalog</title>
    <style>
        :root { --primary: #000; --bg: #f4f4f5; --accent: #25D366; }
        body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: #1a1a1a; padding-bottom: 100px; }
        .header { background: #fff; padding: 16px; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .shop-name { font-size: 20px; font-weight: 800; margin: 0; }
        .shop-info { font-size: 13px; color: #666; margin-top: 4px; }
        
        /* Auto-Switch Notice */
        .offline-badge { background: #ff9800; color: white; font-weight: 700; text-align: center; padding: 8px; font-size: 12px; }
        .online-toast { position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: #4CAF50; color: white; padding: 12px 24px; border-radius: 30px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 2000; cursor: pointer; display: none; }

        .search-bar { margin-top: 12px; }
        .search-input { width: 100%; padding: 12px; border: 2px solid #000; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; padding: 16px; }
        .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
        .card-img { width: 100%; aspect-ratio: 1; object-fit: contain; background: #fff; padding: 10px; box-sizing: border-box; }
        .card-body { padding: 12px; flex: 1; display: flex; flex-direction: column; }
        .badge { display: inline-block; background: #eee; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-bottom: 6px; align-self: start; }
        .p-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; line-height: 1.3; }
        .p-meta { font-size: 12px; color: #666; margin-bottom: 8px; }
        .p-price { font-weight: 800; font-size: 16px; margin-top: auto; }
        
        .btn-add { background: #000; color: white; border: none; padding: 10px; width: 100%; font-weight: 700; border-radius: 6px; margin-top: 12px; cursor: pointer; }
        .btn-qty { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; background: #f5f5f5; border-radius: 6px; padding: 2px; }
        .btn-qty button { background: white; border: 1px solid #ddd; width: 32px; height: 32px; border-radius: 4px; font-weight: 700; cursor: pointer; }
        
        /* Floating Cart */
        .fab-cart { position: fixed; bottom: 20px; right: 20px; background: #000; color: white; padding: 16px 24px; border-radius: 50px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 10px; cursor: pointer; z-index: 500; }
        
        /* Cart Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: none; align-items: end; }
        .modal-overlay.open { display: flex; }
        .modal { background: white; width: 100%; max-width: 500px; margin: 0 auto; border-radius: 20px 20px 0 0; max-height: 80vh; display: flex; flex-direction: column; }
        .modal-header { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .modal-body { padding: 20px; overflow-y: auto; }
        .cart-item { display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f5f5f5; }
        .modal-footer { padding: 20px; border-top: 1px solid #eee; }
        
        .btn-checkout { background: var(--accent); color: white; width: 100%; padding: 16px; font-size: 18px; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; display: flex; justify-content: center; gap: 8px; }
    </style>
</head>
<body>
    <div class="offline-badge">📡 OFFLINE BACKUP MODE</div>
    <div class="online-toast" id="onlineToast" onclick="goBackToLive()">🟢 Internet Restored! Click to Go Live</div>

    <div class="header">
        <h1 class="shop-name">${shop.name}</h1>
        <div class="shop-info">${shop.address} • ${shop.phone}</div>
        <div class="search-bar">
            <input type="text" class="search-input" placeholder="🔍 Search products..." oninput="render(this.value)">
        </div>
    </div>

    <div class="grid" id="grid"></div>

    <div class="fab-cart" id="fabCart" onclick="toggleCart()">
        <span>🛒</span>
        <span id="cartTotal">₹0</span>
        <span id="cartCount" style="background: white; color: black; padding: 2px 8px; border-radius: 10px; font-size: 12px;">0</span>
    </div>

    <!-- Cart Modal -->
    <div class="modal-overlay" id="cartModal">
        <div class="modal">
            <div class="modal-header">
                <h2 style="margin:0">🛒 Your Cart</h2>
                <button onclick="toggleCart()" style="background:none; border:none; font-size: 24px;">×</button>
            </div>
            <div class="modal-body" id="cartItems">
                <!-- Items go here -->
            </div>
            <div class="modal-footer">
                <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-weight: 700; font-size: 18px;">
                    <span>Total To Pay</span>
                    <span id="modalTotal">₹0</span>
                </div>
                <button class="btn-checkout" onclick="checkout()">
                    <span>💬</span> Order via WhatsApp
                </button>
            </div>
        </div>
    </div>

    <script>
        // EMBEDDED DATABASE
        const PRODUCTS = ${JSON.stringify(products)};
        const SHOP_PHONE = "${shopPhone}";
        let CART = {}; // { productId: qty }

        function render(query = '') {
            const grid = document.getElementById('grid');
            const q = query.toLowerCase().trim();
            
            const filtered = PRODUCTS.filter(p => {
                if(q === '') return true;
                return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
            });

            grid.innerHTML = filtered.map(p => {
                const qty = CART[p.id] || 0;
                const price = p.prices[0].price;
                
                let btnHTML = '';
                if (qty === 0) {
                    btnHTML = \`<button class="btn-add" onclick="updateCart('\${p.id}', 1)">+ Add to Cart</button>\`;
                } else {
                    btnHTML = \`
                        <div class="btn-qty">
                            <button onclick="updateCart('\${p.id}', \${qty - 1})">-</button>
                            <span>\${qty}</span>
                            <button onclick="updateCart('\${p.id}', \${qty + 1})">+</button>
                        </div>
                    \`;
                }

                return \`
                    <div class="card">
                        <img src="\${p.image}" class="card-img" loading="lazy">
                        <div class="card-body">
                            <span class="badge">\${p.category}</span>
                            <div class="p-name">\${p.name}</div>
                            <div class="p-meta">\${p.measureValue} \${p.measureUnit}</div>
                            <div class="p-price">₹\${price}</div>
                            \${btnHTML}
                        </div>
                    </div>
                \`;
            }).join('');
            
            updateCartUI();
        }

        function updateCart(id, qty) {
            if (qty <= 0) delete CART[id];
            else CART[id] = qty;
            render(document.querySelector('.search-input').value);
        }

        function updateCartUI() {
            let total = 0;
            let count = 0;
            let cartHTML = '';

            Object.entries(CART).forEach(([id, qty]) => {
                const p = PRODUCTS.find(x => x.id === id);
                if (p) {
                    const price = p.prices[0].price;
                    total += price * qty;
                    count += qty;
                    cartHTML += \`
                        <div class="cart-item">
                            <div>
                                <div style="font-weight:600">\${p.name}</div>
                                <div style="font-size:12px; color:#666">\${qty} x ₹\${price}</div>
                            </div>
                            <div style="font-weight:700">₹\${price * qty}</div>
                        </div>
                    \`;
                }
            });

            document.getElementById('cartTotal').innerText = '₹' + total;
            document.getElementById('cartCount').innerText = count;
            document.getElementById('modalTotal').innerText = '₹' + total;
            document.getElementById('cartItems').innerHTML = cartHTML || '<p style="text-align:center; color:#999">Your cart is empty</p>';
            
            if (count > 0) document.getElementById('fabCart').style.display = 'flex';
            else document.getElementById('fabCart').style.display = 'none';
        }

        function toggleCart() {
            document.getElementById('cartModal').classList.toggle('open');
        }

        function checkout() {
            if (Object.keys(CART).length === 0) return;
            
            let msg = "Hi, I want to order:\\n\\n";
            let total = 0;

            Object.entries(CART).forEach(([id, qty], index) => {
                const p = PRODUCTS.find(x => x.id === id);
                const price = p.prices[0].price;
                total += price * qty;
                msg += \`\${index + 1}. \${p.name} (\${qty} x ₹\${price}) = ₹\${price * qty}\\n\`;
            });

            msg += \`\\nTotal Amount: *₹\${total}*\\n\\nPlease confirm availability.\`;
            
            window.open(\`https://wa.me/\${SHOP_PHONE}?text=\${encodeURIComponent(msg)}\`, '_blank');
        }

        // ============================================
        // AUTO-RECOVER (SMART SWITCH LOGIC)
        // ============================================
        // Check if the Live Server is back online
        
        const LIVE_CHECK_URL = "${window.location.origin}/api/shop"; // This will be the tunnel URL when generated
        
        // If we are strictly offline (file://), this might be tricky, but if hosted on Netlify, 
        // the user would have set the Live URL manually. For now, we assume the user might manually go back.
        // But let's try a simple ping if we know the domain.

        function goBackToLive() {
             // In a real scenario, we'd need to know the dynamic tunnel URL.
             // Since the tunnel URL changes every time, we can't hardcode it easily 
             // UNLESS the user updates the static catalog every session (which is tedious).
             // However, if the user keeps the tab open, maybe we can rely on history.
             window.history.back(); 
        }

        // Initial Render
        render();
    <\/script>
</body>
</html>`;

    // DOWNLOAD TRIGGER
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${shop.name.replace(/\s+/g, '_')}_24x7_Catalog.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// ============================================
// LIVE TUNNEL FEATURE
// ============================================
RetailerApp.prototype.goLive = async function () {
    const btn = document.querySelector('button[onclick="retailerApp.goLive()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Starting...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/tunnel/start', { method: 'POST' });
        const data = await response.json();

        if (data.success && data.url) {
            btn.innerHTML = '🟢 Live Active';
            btn.style.background = '#4CAF50';

            // Show the link to the user
            const msg = `
                <div style="text-align: left;">
                    <h3 style="margin-top:0;">🌍 You are LIVE Globally!</h3>
                    <p style="color:#666; margin-bottom:15px;">Your shop is now online. Share these links:</p>

                    <div style="margin-bottom: 15px;">
                        <div style="font-weight:700; font-size:12px; text-transform:uppercase; color:#e91e63;">🛍️ Customer Shop Link</div>
                        <div style="background: #fdf2f7; padding: 8px; border: 1px solid #f8bbd0; border-radius: 4px; font-family: monospace; word-break: break-all;">
                            <a href="${data.url}/customer/index.html" target="_blank" style="text-decoration:none; color:#c2185b;">${data.url}/customer/index.html</a>
                        </div>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <div style="font-weight:700; font-size:12px; text-transform:uppercase; color:#2196f3;">🔐 Retailer Admin Link</div>
                        <div style="background: #e3f2fd; padding: 8px; border: 1px solid #bbdefb; border-radius: 4px; font-family: monospace; word-break: break-all;">
                            <a href="${data.url}/retailer/index.html" target="_blank" style="text-decoration:none; color:#1565c0;">${data.url}/retailer/index.html</a>
                        </div>
                    </div>
                    
                    <p style="font-size: 11px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
                        <strong>⚠️ Important:</strong> Keep this tab OPEN. Closing it stops the server.
                    </p>
                </div>
            `;

            // Minimal Modal for Link Display
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:10000;';
            modal.innerHTML = `
                <div style="background:white;padding:30px;border-radius:12px;max-width:500px;width:90%;box-shadow:0 10px 25px rgba(0,0,0,0.2);">
                    ${msg}
                    <div style="margin-top:20px;text-align:right;">
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="padding:8px 16px;background:#333;color:white;border:none;border-radius:4px;cursor:pointer;">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

        } else {
            alert('Failed to go live: ' + (data.message || 'Unknown error'));
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Go Live error:', error);
        alert('Error connecting to server tunnel.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// ============================================
// PERMANENT TUNNEL MONITOR & GIT SYNC
// ============================================

RetailerApp.prototype.syncToGitHub = async function () {
    if (!confirm('Sync latest changes (Catalogs/Data) to GitHub Cloud?')) return;

    try {
        const btn = document.querySelector('button[onclick="retailerApp.syncToGitHub()"]');
        let originalText = '☁️ Sync to GitHub';
        if (btn) {
            originalText = btn.innerText;
            btn.innerText = '☁️ Syncing...';
            btn.disabled = true;
        }

        const response = await fetch(`${dataManager.apiBase}/deploy`, { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            alert('✅ Sync Complete! Your backups are on GitHub.');
        } else {
            alert('❌ Sync Failed. Check if you have set "git remote add origin ..." on this PC.');
        }

        if (btn) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    } catch (e) {
        alert('Error: ' + e.message);
        const btn = document.querySelector('button[onclick="retailerApp.syncToGitHub()"]');
        if (btn) btn.disabled = false;
    }
};

RetailerApp.prototype.checkTunnelStatus = async function () {
    const linkDisplay = document.getElementById('tunnelLinkDisplay');
    const guestCodeDisplay = document.getElementById('guestCodeDisplay');

    // Only update if the elements exist (dashboard is rendered)
    if (!linkDisplay) return;

    try {
        const response = await fetch(`${dataManager.apiBase}/tunnel/status`);
        const data = await response.json();

        if (data.active && data.url) {
            // Update Link View
            if (linkDisplay.innerText !== data.url) {
                linkDisplay.innerHTML = `<a href="${data.url}/retailer/index.html" target="_blank" style="text-decoration:none; color:#1565c0;">${data.url}</a>`;
            }

            // Update Guest Code
            if (data.password) {
                guestCodeDisplay.innerText = data.password;
                guestCodeDisplay.style.color = '#e65100';
            } else {
                guestCodeDisplay.innerText = 'Loading...';
            }
        } else {
            linkDisplay.innerHTML = '<span style="color:#d32f2f;">🔴 Connecting...</span>';
            guestCodeDisplay.innerText = '...';
        }
    } catch (e) {
        if (linkDisplay) linkDisplay.innerHTML = '<span style="color:#d32f2f;">⚠️ Server Offline</span>';
    }
};

RetailerApp.prototype.startTunnelMonitor = function () {
    this.checkTunnelStatus();
    setInterval(() => this.checkTunnelStatus(), 5000);
};

// Auto-start monitoring if app is ready
if (typeof retailerApp !== 'undefined') {
    retailerApp.startTunnelMonitor();
} else {
    window.addEventListener('load', () => {
        if (typeof retailerApp !== 'undefined') retailerApp.startTunnelMonitor();
    });
}
