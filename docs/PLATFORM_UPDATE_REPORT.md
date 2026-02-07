# 🛒 Customer & Retailer Platform Updates

I have completed the requested enhancements for both the Retailer Dashboard and Customer App.

## 1. 🎁 Retailer: Offer Search
- **Added Search Bar**: You can now search Offers by name.
- **Optimized**: Uses the same non-blocking search engine as the other tabs.

## 2. 👥 Retailer: Customer Folders
- **Fixed**: "0 bills" display issue. Folders now correctly show the number of bills inside using a dynamic count.

## 3. 🛍️ Customer App: Privacy & Points
- **Stock Privacy**:
  - Replaced exact stock numbers with meaningful status:
  - **"In Stock"** (Available)
  - **"Low Stock"** (If ≤ 5 items)
  - **"Out of Stock"** (If 0)
- **Points Redemption**:
  - **Bill Breakdown**: The "My Bills" section now shows a full receipt breakdown, including **Offer Discounts**, **GST**, and **Points Used/Discount**.
  - **Entry**: Verified points input logic. It appears if you have points. If you previously couldn't see it, it might have been due to 0 balance or a sync delay (now fixed by ensuring data reloads properly).

## Verification
- **Retailer**: Go to Offers -> Search. Go to Customers -> Check bill counts.
- **Customer**: View a product (observe stock text). Place an order -> Use Points -> Check "My Bills" for the red "Points Used" line.
