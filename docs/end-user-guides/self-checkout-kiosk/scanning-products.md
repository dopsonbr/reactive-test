# Scanning Products

Learn how to add products to your cart using the barcode scanner or manual SKU entry.

---

## Using the Barcode Scanner

The fastest way to add items is by scanning their barcodes.

### Locating the Scanner

The barcode scanner is built into the kiosk, located below the screen. It has a red scanning light that activates when you're on the scanning screen.

![Scanner Location](images/scanner-location-wireframe.png)
*The barcode scanner is located below the touch screen*

### How to Scan

1. **Find the barcode** on your product (usually on the back or bottom)
2. **Hold the item** with the barcode facing the scanner
3. **Position the barcode** in front of the red scanning light
4. **Wait for the beep** - you'll hear a confirmation sound and see the item appear on screen

![Scanning a Product](images/scanning-product-wireframe.png)
*Hold the barcode in front of the scanner*

### Scanning Tips

| Tip | Description |
|-----|-------------|
| **Distance** | Hold items 4-8 inches from the scanner |
| **Angle** | Keep the barcode flat and facing the scanner |
| **Lighting** | The scanner works in all store lighting conditions |
| **Multiple items** | Scan one item at a time |

### Successful Scan

When an item scans successfully:

1. You'll hear a **confirmation beep**
2. The product **appears in your cart** on the right side
3. A **brief product card** shows the item name and price
4. The **cart total updates** automatically

![Scan Success](images/scan-success-wireframe.png)
*A successful scan shows the product details*

---

## Manual SKU Entry

If a barcode won't scan, you can enter the product's SKU number manually.

### When to Use Manual Entry

- Damaged or wrinkled barcodes
- Barcode not scanning after multiple attempts
- Products without barcodes (like some produce)
- Items with SKU stickers instead of barcodes

### Finding the SKU

The SKU (Stock Keeping Unit) is a unique product identifier. Look for it:

- **On the price tag** attached to the item
- **On the shelf label** where you picked up the item
- **Near the barcode** (usually smaller numbers above or below)

SKU format: Usually 6-12 digits (e.g., `SKU-001234` or `123456789012`)

### How to Enter SKU Manually

1. **Tap "Enter SKU"** button on the scanning screen

![Enter SKU Button](images/enter-sku-button-wireframe.png)
*Tap the Enter SKU button to open the keypad*

2. **Use the numeric keypad** to enter the SKU number

![Numeric Keypad](images/numeric-keypad-wireframe.png)
*The touch-friendly numeric keypad*

3. **Tap "Search"** to look up the product

4. **Confirm the product** when it appears

![Product Confirmation](images/product-confirm-wireframe.png)
*Verify this is the correct product before adding*

5. **Tap "Add to Cart"** to add the item

### Keypad Controls

| Button | Action |
|--------|--------|
| **0-9** | Enter digits |
| **Clear** | Remove all entered digits |
| **⌫** (Backspace) | Remove last digit |
| **Search** | Look up the entered SKU |
| **Cancel** | Close keypad and return to scanning |

---

## Scanning Multiple Quantities

If you have multiple identical items:

### Option 1: Scan Each Item
Simply scan each item individually. The cart will show the quantity increasing.

### Option 2: Scan Once, Adjust Quantity
1. Scan the item once
2. Find the item in your cart
3. Tap the **"+"** button to increase quantity
4. See [Managing Your Cart](cart-management.md) for details

---

## Product Information Display

After scanning, a product card briefly appears showing:

```
┌─────────────────────────────────────────────┐
│  ┌───────┐                                  │
│  │ IMAGE │   Product Name                   │
│  │       │   SKU: 123456789012              │
│  └───────┘                                  │
│                                             │
│            $12.99                           │
│                                             │
│  ✓ Added to cart                            │
└─────────────────────────────────────────────┘
```

![Product Card](images/product-card-wireframe.png)
*Product details appear after scanning*

### Information Shown

- **Product image** (when available)
- **Product name**
- **SKU number**
- **Price**
- **Stock status** (for quantity limitations)

---

## Handling Scan Errors

### Item Not Found

If the SKU doesn't exist in our system:

![Item Not Found](images/item-not-found-wireframe.png)
*The item not found error screen*

**What to do:**
1. Double-check you entered the correct SKU
2. Try scanning the barcode again
3. Request help from a store associate

### Item Unavailable

Some items cannot be purchased at self-checkout:

- Age-restricted items (alcohol, tobacco)
- High-value items requiring verification
- Items that need weighing

![Item Unavailable](images/item-unavailable-wireframe.png)
*Some items require associate assistance*

**What to do:**
1. Request help using the "Help" button
2. A store associate will assist you

### Scanner Not Responding

If the scanner doesn't seem to be working:

1. Make sure you're on the **scanning screen**
2. Check for the **red scanning light**
3. Try **manual SKU entry** as an alternative
4. Press **"Help"** if problems persist

---

## Quick Scanning Tips

1. **Remove items from bags** before scanning - barcodes scan better when visible
2. **Keep barcodes flat** - curved or wrinkled barcodes are harder to read
3. **One item at a time** - the scanner can only read one barcode at once
4. **Listen for the beep** - don't scan the next item until you hear confirmation
5. **Check the cart** - verify items appear correctly after each scan

---

## Next Steps

After scanning all your items:

- [Review and manage your cart](cart-management.md)
- [Link your loyalty account](loyalty-account.md)

---

[← Getting Started](getting-started.md) | [Back to Index](index.md) | [Next: Managing Your Cart →](cart-management.md)
