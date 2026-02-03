# Kirana Billing Platform

A comprehensive dual-interface, real-time synchronized digital billing and retail management system designed for Indian kirana (neighborhood grocery) stores.

## 🚀 Features

### Customer Platform
- **Simple Registration**: Name + Mobile number only
- **Product Discovery**: Search, filter by category/brand, sort by price/name
- **Smart Shopping Cart**: Real-time pricing with GST breakdown
- **Wishlist**: Save favorite products
- **Points System**: Earn and redeem loyalty points
- **Offers**: Automatic discount application (BOGO, bulk, welcome, festival, etc.)
- **Bill Tracking**: Real-time status updates (Pending/Approved/Rejected)
- **Stock Validation**: Cannot buy more than available stock

### Retailer Dashboard
- **📊 Dashboard**: 33+ real-time business insights
  - Revenue metrics (total, today, week, month)
  - Customer analytics (retention, repeat customers)
  - Inventory insights (low stock alerts, out of stock)
  - Sales performance (conversion rate, avg bill value)
  - GST and discount tracking
  - Wishlist demand analysis
  
- **📥 Request Management**: 
  - Approve/reject customer bills
  - Auto-correction for points double-spend
  - Real-time stock updates
  
- **📄 Bill Management**:
  - View detailed bills
  - Print bills
  - Share via WhatsApp
  - Customer folder system (grouped by Name+Mobile)
  
- **📦 Products**:
  - Inline stock/price adjustment (up/down arrows)
  - Add/Edit/Delete products
  - CSV bulk import/export
  - Auto-fill with GST calculation (per Govt of India rules)
  - Image URL support
  
- **🎁 Offers & Discounts**:
  - 10+ preset offer types:
    - Percentage Off
    - Fixed Amount Off
    - Buy One Get One (BOGO)
    - Bulk Discount
    - Welcome Offer (first purchase)
    - Festival Special
    - Clearance Sale
    - Combo Deals
    - Seasonal Discounts
    - Loyalty Rewards
  - Category or product-specific offers
  - Date range control
  
- **👥 Customer Folders**:
  - Bills grouped by customer (Name+Mobile identity)
  - View customer history, points, wishlist
  - Privacy maintained (data isolation)
  
- **⚙️ Settings**:
  - Shop information (name, address, GSTIN)
  - Points ratio configuration
  - Low stock threshold
  - GST rules (read-only, per Govt of India)

## 🔒 Security & Data

- **Encryption**: AES-256 simulation for all stored data
- **Data Isolation**: Unique customer identity (Name+Mobile)
- **Privacy**: No third-party data sharing
- **Persistent Storage**: LocalStorage with real-time sync (1.5s interval)
- **Stock Protection**: Prevents negative stock, enforces limits

## 🎨 Design

- **High Contrast UI**: Black text on white backgrounds for maximum readability
- **Mobile Optimized**: Fully responsive, touch-friendly
- **QR Codes**: Instant mobile access
- **Professional Bills**: Print-ready with shop branding, GST compliance, return policy

## 📋 GST Compliance

GST rates are automatically applied based on Government of India rules:
- 0%: Essential commodities (salt, milk, bread, fresh produce)
- 5%: Sugar, tea, coffee, edible oil
- 12%: Butter, ghee, instant food, noodles
- 18%: Biscuits, snacks, soap, shampoo, toothpaste, detergent
- 28%: Aerated drinks, luxury items

**Retailers cannot modify GST rates** - they are fixed per product category.

## 🚀 Getting Started

1. Open `index.html` in a browser
2. Choose Customer or Retailer platform
3. **Customer**: Register with name + mobile, browse products, add to cart, submit bill request
4. **Retailer**: Manage products, approve requests, view insights

## 📱 Mobile Access

Scan the QR codes on the landing page to access the platforms on mobile devices.

## 📊 CSV Import Format

For bulk product import:
```
name,brand,category,stock,price
Tata Salt,Tata,Groceries,50,20
Amul Butter,Amul,Dairy,30,50
```

## 🔄 Real-Time Sync

All changes sync automatically every 1.5 seconds:
- Product updates appear instantly for customers
- Bill requests show up immediately for retailers
- Stock changes reflect in real-time
- No manual refresh needed

## 💡 Key Innovations

1. **Points Auto-Correction**: If a customer tries to use the same points twice, the system auto-corrects the second bill
2. **Wishlist Insights**: Retailers see which products are in high demand
3. **Smart Offers**: 10+ preset offer types with auto-configuration
4. **Customer Folders**: Bills automatically grouped by customer identity
5. **Inline Editing**: Adjust stock/price directly in the table with arrows
6. **Auto-fill**: Product GST and image suggestions based on name/brand

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Storage**: LocalStorage with encryption
- **Sync**: Real-time polling (1.5s)
- **Design**: High-contrast, mobile-first
- **No Dependencies**: Pure JavaScript (except QRCode.js for QR generation)

## 📞 Support

For issues or questions, contact the shop owner.

## 📄 Return Policy

Products can be returned within 2 days from purchase date. No returns accepted for seal breakage products.

---

**Built for Indian Kirana Stores** 🇮🇳
