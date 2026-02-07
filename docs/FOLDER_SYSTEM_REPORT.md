# 📂 Customer Folder System Update

I have enforced the strict folder creation logic as requested. The system now follows these exact rules:

## 1. Strictly Unique Identity
A customer is identified by their **Name** and **Mobile Number**.
- **Rule 1**: If **Name matches** (case-insensitive) AND **Mobile matches** (digits only) -> **SAME FOLDER**.
- **Rule 2**: If **Name is different** -> **NEW FOLDER**.
- **Rule 3**: If **Mobile is different** -> **NEW FOLDER**.

## 2. Examples of Behavior
| Login Name | Mobile | Result |
|------------|--------|--------|
| Rahul | 9999999999 | **Folder A** |
| rahul | 999 999 9999 | **Folder A** (Merged - ignores case & spaces) |
| Rahul Kumar | 9999999999 | **Folder B** (Different Name) |
| Rahul | 8888888888 | **Folder C** (Different Mobile) |

## 3. Data Persistence
When a customer logs in with credentials that match an existing folder (e.g., "rahul" matching "Rahul"), they will immediately see:
- ✅ Their **Wishlist**
- ✅ Their **Points Balance**
- ✅ Their **Bill History**

## 4. Fixes Applied
- **Backend (`dataManager.js`)**: Updated `getCustomerIdentity` to strictly sanitize inputs (lowercase name, digit-only mobile) before looking up folders.
- **Frontend (`retailer.js`)**: Fixed a bug where customer names with quotes (e.g., D'Souza) would break the folder view.

The system now strictly adheres to the "Same Name + Same Mobile" rule for data consolidation.
