# 🔐 Access Control System

## Overview

The platform now has **separate access control** for Retailer and Customer platforms:

### ✅ Customer Platform - **PUBLIC ACCESS**
- **Unlimited access** - No restrictions
- Can handle **thousands or lakhs** of customers
- No device registration required
- Anyone can access `customer.html` and use the platform

### 🔒 Retailer Platform - **LIMITED ACCESS**
- **Device registration required** - Maximum 10 authorized devices
- Only registered devices can access retailer features
- Requires admin password to register new devices
- Perfect for shop owners, managers, and staff

## How It Works

### Device Registration Process

1. **Access Retailer Login**: Go to `http://localhost:8000/retailer-login.html`
2. **Enter Device Name**: Give your device a name (e.g., "Shop Laptop", "Manager Phone")
3. **Enter Admin Password**: Use the admin password (default: `kirana2026`)
4. **Register**: Device is registered and can now access retailer dashboard

### Device Limits

- **Maximum Devices**: 10 authorized devices
- **Device Identification**: Based on browser fingerprint + IP address
- **Storage**: Authorized devices stored in `authorized_devices.json`

## Security Features

### Retailer Protection
- ✅ `retailer.html` - Protected, redirects to login if not authorized
- ✅ Retailer API routes - Protected (products, bills, requests, offers, settings)
- ✅ Device fingerprinting - Unique ID per device

### Customer Access
- ✅ `customer.html` - Public access, no restrictions
- ✅ Customer API routes - Public (customers can access their data)
- ✅ Unlimited scalability - Can handle unlimited customers

## Default Admin Password

**Default Password**: `kirana2026`

⚠️ **IMPORTANT**: Change the admin password in `server.js`:
```javascript
const ADMIN_PASSWORD = 'your-secure-password-here';
```

## Managing Authorized Devices

### View Authorized Devices
- Access `/api/device/list` (requires authorization)
- Shows all registered devices with names and registration dates

### Remove Device
- Edit `authorized_devices.json` manually
- Or implement device management in retailer dashboard

## Files Created

1. **`retailer-login.html`** - Device registration/login page
2. **`authorized_devices.json`** - Stores authorized device list (auto-created)
3. **Updated `server.js`** - Added device authentication system
4. **Updated `index.html`** - Separate links for customer and retailer

## Usage Flow

### For Customers:
1. Go to `http://localhost:8000`
2. Click "Enter as Customer"
3. Start using immediately - no restrictions

### For Retailers:
1. Go to `http://localhost:8000`
2. Click "Enter as Retailer"
3. Register device (first time only)
4. Access retailer dashboard

## Benefits

✅ **Scalability**: Customer platform can handle unlimited users
✅ **Security**: Retailer platform protected from unauthorized access
✅ **Flexibility**: Up to 10 devices can access retailer features
✅ **Same Storage**: Both platforms use the same device-wide data storage

---

**Note**: All data is still stored locally in `data.json` - device-wide storage remains the same!
