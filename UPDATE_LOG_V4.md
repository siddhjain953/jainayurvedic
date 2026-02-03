# 🐛 Bug Fix: Retailer Settings Editing

## Problem
In the **Retailer Settings** page, trying to edit number fields (like "Points Ratio" or "Point Value") would fail. The numbers would reset or refuse to update.

## Root Cause
- The app refreshes the screen often to check for new orders.
- The "Focus Preservation" system I built earlier trie to save your typing.
- **However**, for `Number` inputs (like points), browsers throw an error if we ask for "Cursor Position".
- This error caused the "Value Saving" logic to crash silently for those specific fields. So, your new number was never saved, and the refresh reverted it to the old value.

## The Fix
- I updated the `render()` logic to **safely capture the value first**, before asking for cursor position.
- If the browser complains about cursor position (for number fields), we ignore that error but **keep the value**.
- **Result**: You can now edit "Points Ratio", "Point Value", and "Low Stock Threshold" freely. The app preserves your input perfectly during background updates.

## Verification
1. Open **Retailer Dashboard** -> **Settings**.
2. Change "Points Ratio" from `100` to `50`.
3. It should stay `50` and not revert.
4. Click **Save Settings** to confirm.
