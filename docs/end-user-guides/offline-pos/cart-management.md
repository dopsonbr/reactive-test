# Cart Management

Learn how to review items, adjust quantities, and prepare for payment.

---

## Viewing the Cart

Tap **View Cart** from the scan screen to see all items:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFLINE POS                    │  Operator: 1234  │  [🔴 Offline]  [🚪]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CART                                                                    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Premium Coffee Beans 12oz                                      │    │
│  │  [-]  2  [+]                              $25.98           [×]  │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │  Whole Milk 1 Gallon                                            │    │
│  │  [-]  1  [+]                               $4.29           [×]  │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │  Organic Eggs 12ct                                              │    │
│  │  [-]  1  [+]                               $5.99           [×]  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Subtotal:                                                    $36.26    │
│  Tax:                                                          $2.90    │
│  ─────────────────────────────────────────────────────────────────      │
│  TOTAL:                                                       $39.16    │
│                                                                          │
│         [Add More Items]                     [Pay]                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Cart Item Details

Each item shows:

| Element | Description |
|---------|-------------|
| **Product Name** | Item description |
| **Quantity Controls** | `[-]` and `[+]` buttons to adjust |
| **Quantity** | Current number of units |
| **Line Total** | Price × quantity |
| **Remove** `[×]` | Delete item from cart |

---

## Adjusting Quantities

### Increase Quantity

Tap **[+]** to add one more of an item:

```
Premium Coffee Beans 12oz
[-]  2  [+]  →  [-]  3  [+]
```

### Decrease Quantity

Tap **[-]** to remove one:

```
Premium Coffee Beans 12oz
[-]  3  [+]  →  [-]  2  [+]
```

**Note:** Quantity cannot go below 1. To remove an item completely, use the **[×]** button.

---

## Removing Items

To remove an item entirely:

1. Locate the item in the cart
2. Tap the **[×]** button on the right
3. Item is removed immediately

```
┌────────────────────────────────────────────────────────────────┐
│  Whole Milk 1 Gallon                                           │
│  [-]  1  [+]                               $4.29          [×]  │  ← Tap to remove
└────────────────────────────────────────────────────────────────┘
```

**Tip:** If a customer changes their mind, it's often faster to remove and re-scan than to adjust quantity multiple times.

---

## Understanding Totals

The cart displays three totals:

| Line | Description |
|------|-------------|
| **Subtotal** | Sum of all item prices |
| **Tax** | Calculated tax (based on store location) |
| **TOTAL** | Final amount the customer owes |

### Tax Calculation

Tax is calculated automatically based on:
- Store location (configured in system)
- Tax-exempt items excluded

---

## Empty Cart

If the cart is empty:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  CART                                                                    │
│                                                                          │
│                        Cart is empty                                     │
│                                                                          │
│                    [Start Scanning]                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

Tap **Start Scanning** to return to the scan screen.

---

## Adding More Items

From the cart, you can return to add more items:

1. Tap **[Add More Items]**
2. You'll return to the scan screen
3. Scan or search for additional products
4. Tap **View Cart** when done

---

## Proceeding to Payment

When the cart is complete:

1. **Verify items** - Check that all products and quantities are correct
2. **Confirm total** - Inform customer of the amount due
3. **Tap [Pay]** - Proceed to payment screen

---

## Cart Quick Reference

### Action Buttons

| Button | Action |
|--------|--------|
| **[-]** | Decrease quantity by 1 |
| **[+]** | Increase quantity by 1 |
| **[×]** | Remove item from cart |
| **[Add More Items]** | Return to scan screen |
| **[Pay]** | Proceed to payment |

### Flow

```
Scan Screen  ←──  [Add More Items]
     │
     ▼
Cart Screen  ──→  [Pay]  ──→  Payment Screen
```

---

## Common Cart Scenarios

### Customer Wants to Remove Something

1. Find the item in the cart
2. Tap **[×]** to remove
3. Cart total updates automatically

### Customer Wants Different Quantity

1. Find the item
2. Use **[-]** or **[+]** to adjust
3. Line total and cart total update

### Customer Wants to Add Another Item

1. Tap **[Add More Items]**
2. Scan or search for the product
3. Return to cart to verify

### Customer Wants to Cancel Everything

1. Remove all items using **[×]** buttons
2. Or sign out if no items have been added

**Note:** There is no "clear cart" button - items must be removed individually or by signing out.

---

## Best Practices

### Before Payment
- [ ] Verify all items are correct
- [ ] Confirm quantities match physical items
- [ ] State the total to the customer
- [ ] Ask if they found everything they need

### Common Adjustments
- **Damaged item** → Remove and set aside
- **Price check** → Cannot check online; use scanned price
- **Wrong item scanned** → Remove, scan correct item

---

## Next Steps

When the cart is complete:

- [Process Payment](payment.md) - Complete the transaction

---

[← Scanning Items](scanning-items.md) | [Back to Index](index.md) | [Next: Payment →](payment.md)
