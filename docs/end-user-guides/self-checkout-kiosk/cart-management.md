# Managing Your Cart

Learn how to review, edit, and manage items in your cart before checkout.

---

## Cart Overview

Your cart is displayed on the right side of the screen throughout your transaction. As you scan items, they appear here automatically.

![Cart Panel](images/cart-panel-wireframe.png)
*The cart panel shows all your items*

### Cart Panel Elements

```
┌─────────────────────────────────────┐
│  YOUR CART                    (5)   │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [img] Product Name          │   │
│  │       $12.99    [-] 2 [+]   │   │
│  │                    $25.98   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [img] Another Product       │   │
│  │       $8.49     [-] 1 [+]   │   │
│  │                     $8.49   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ... (scrollable)                   │
│                                     │
├─────────────────────────────────────┤
│  Subtotal              $34.47      │
│  Discounts             -$5.00      │
│  Tax                    $2.76      │
├─────────────────────────────────────┤
│  TOTAL                 $32.23      │
└─────────────────────────────────────┘
```

---

## Viewing Cart Details

### Accessing Full Cart View

To see more details about your cart:

1. Tap **"Review Cart"** button or
2. Tap anywhere on the cart summary panel

![Review Cart Button](images/review-cart-button-wireframe.png)
*Tap Review Cart to see the full cart view*

### Full Cart Screen

The full cart view shows:

![Full Cart View](images/full-cart-view-wireframe.png)
*The full cart view provides detailed item management*

- **Larger product images**
- **Full product names** (not truncated)
- **Individual item prices**
- **Line item totals**
- **Easy access to quantity controls**
- **Remove item buttons**

---

## Adjusting Quantities

### Using the +/- Buttons

Each item in your cart has quantity controls:

```
┌────────────────────────────────────────────┐
│  [Product Image]                           │
│                                            │
│  Organic Bananas (bunch)                   │
│  $2.99 each                                │
│                                            │
│     ┌───┐  ┌─────┐  ┌───┐                 │
│     │ - │  │  3  │  │ + │                 │
│     └───┘  └─────┘  └───┘                 │
│                                            │
│  Line Total: $8.97                         │
└────────────────────────────────────────────┘
```

| Button | Action |
|--------|--------|
| **-** | Decrease quantity by 1 |
| **+** | Increase quantity by 1 |
| **Number** | Shows current quantity |

![Quantity Controls](images/quantity-controls-wireframe.png)
*Use + and - buttons to adjust quantities*

### Quantity Limits

- **Minimum**: 1 (use Remove to delete item completely)
- **Maximum**: Based on store inventory (typically 99)

If you try to exceed available inventory:

![Stock Limit Warning](images/stock-limit-wireframe.png)
*A warning appears when stock is limited*

### Direct Quantity Entry

For large quantity changes:

1. **Tap the quantity number** in the center
2. A **numeric keypad** appears
3. **Enter the new quantity**
4. **Tap "Done"** to confirm

![Direct Quantity Entry](images/quantity-entry-wireframe.png)
*Tap the number to enter a specific quantity*

---

## Removing Items

### From Cart Summary

1. **Swipe left** on the item in the cart panel
2. A **"Remove"** button appears
3. **Tap "Remove"** to delete the item

![Swipe to Remove](images/swipe-remove-wireframe.png)
*Swipe left to reveal the remove option*

### From Full Cart View

1. Open the **full cart view**
2. Find the item you want to remove
3. Tap the **trash icon** (🗑️) next to the item
4. **Confirm removal** when prompted

![Remove Button](images/remove-button-wireframe.png)
*Tap the trash icon to remove an item*

### Confirmation Dialog

When removing items, you'll see a confirmation:

```
┌─────────────────────────────────────┐
│                                     │
│   Remove this item?                 │
│                                     │
│   Organic Bananas (bunch)           │
│   Qty: 3 - $8.97                    │
│                                     │
│   ┌──────────┐    ┌──────────────┐ │
│   │  Cancel  │    │    Remove    │ │
│   └──────────┘    └──────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

![Remove Confirmation](images/remove-confirm-wireframe.png)
*Confirm before removing items*

---

## Price Information

### Understanding Prices

| Field | Description |
|-------|-------------|
| **Unit Price** | Price per individual item |
| **Quantity** | Number of this item in cart |
| **Line Total** | Unit Price × Quantity |
| **Subtotal** | Sum of all line totals |
| **Discounts** | Any applied promotional or loyalty discounts |
| **Tax** | Calculated sales tax |
| **Total** | Final amount you'll pay |

### Price Discrepancies

If a scanned price differs from the shelf price:

1. **Note the discrepancy**
2. Press **"Help"** button
3. A store associate will verify and adjust if needed

![Price Check](images/price-check-wireframe.png)
*Request a price check if needed*

---

## Viewing Item Details

To see more information about a product:

1. **Tap on the product** in your cart
2. An **item detail panel** slides up

![Item Details](images/item-details-wireframe.png)
*Tap an item to see full details*

### Details Shown

- Full product name
- Product image (larger)
- SKU number
- Unit price
- Product description (when available)
- Allergen information (for food items)
- Quantity controls
- Remove option

---

## Cart Totals Breakdown

At the bottom of the cart, you'll see:

```
┌─────────────────────────────────────┐
│  SUMMARY                            │
├─────────────────────────────────────┤
│  Items (5)             $45.97      │
│                                     │
│  Subtotal              $45.97      │
│  Loyalty Discount      -$5.00  ⓘ  │
│  Promo: SAVE10         -$4.60  ⓘ  │
│                        ─────────   │
│  Before Tax            $36.37      │
│  Tax (8%)               $2.91      │
│                        ═════════   │
│  TOTAL                 $39.28      │
└─────────────────────────────────────┘
```

### Discount Information

Tap the **ⓘ** icon next to any discount to see details:

![Discount Details](images/discount-details-wireframe.png)
*Tap the info icon to learn about discounts*

---

## Empty Cart

If you remove all items, the cart shows an empty state:

![Empty Cart](images/empty-cart-wireframe.png)
*An empty cart prompts you to start scanning*

You can:
- **Start scanning** new items
- **Cancel transaction** to return to the welcome screen

---

## Cart Actions

### Continue Shopping

After reviewing your cart, tap **"Continue Scanning"** to add more items.

### Proceed to Checkout

When you're ready:

1. Review your cart one final time
2. Tap **"Proceed to Checkout"**
3. You'll be prompted to link your loyalty account (optional)

### Cancel Transaction

To cancel your entire transaction:

1. Tap **"Cancel Transaction"**
2. Confirm when prompted
3. All items are removed and the kiosk resets

![Cancel Confirmation](images/cancel-confirm-wireframe.png)
*Confirm before canceling your transaction*

---

## Tips for Cart Management

1. **Review before checkout** - Double-check quantities and prices
2. **Watch the total** - Keep an eye on the running total as you shop
3. **Remove unwanted items promptly** - Don't wait until checkout
4. **Check for duplicates** - Make sure items weren't accidentally scanned twice
5. **Note discounts** - Verify expected discounts are being applied

---

## Next Steps

After reviewing your cart:

- [Link your loyalty account](loyalty-account.md) for discounts
- [Proceed to checkout](checkout.md)

---

[← Scanning Products](scanning-products.md) | [Back to Index](index.md) | [Next: Loyalty Account →](loyalty-account.md)
