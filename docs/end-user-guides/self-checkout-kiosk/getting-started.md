# Getting Started

This guide will walk you through starting a transaction at the self-checkout kiosk.

---

## Locating a Kiosk

Self-checkout kiosks are typically located near the front of the store, close to traditional checkout lanes. Look for the "Self-Checkout" signage above the terminal area.

![Kiosk Location](images/kiosk-location-wireframe.png)
*Self-checkout kiosks are located near the store entrance*

---

## Starting Your Transaction

### Step 1: Approach the Kiosk

Walk up to any available kiosk. Available kiosks display a welcome screen with the message "Tap to Start."

![Welcome Screen](images/welcome-screen-wireframe.png)
*The welcome screen invites you to begin*

### Step 2: Tap the Screen

Touch anywhere on the screen to begin your transaction. The kiosk will respond with a brief animation and transition to the scanning screen.

### Step 3: Ready to Scan

Once the scanning screen appears, you're ready to start adding items to your cart.

![Scanning Screen Ready](images/scan-screen-ready-wireframe.png)
*The scanning screen indicates you're ready to add items*

---

## Screen Layout

The kiosk interface is designed for easy navigation:

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    HEADER BAR                        │   │
│  │              Store Name  •  Transaction #            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │                      │  │                          │   │
│  │    MAIN CONTENT      │  │      CART SUMMARY        │   │
│  │                      │  │                          │   │
│  │  (Scanning area,     │  │   • Item list            │   │
│  │   product details,   │  │   • Quantities           │   │
│  │   or forms)          │  │   • Running total        │   │
│  │                      │  │                          │   │
│  └──────────────────────┘  └──────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   ACTION BUTTONS                     │   │
│  │   [Help]    [Cancel Transaction]    [Proceed ▶]     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Header Bar
Displays the store name and your transaction number for reference.

### Main Content Area
This area changes based on where you are in the checkout process:
- **Scanning**: Shows scan instructions and manual entry option
- **Cart Review**: Shows detailed item list with edit options
- **Loyalty**: Shows phone/email entry form
- **Payment**: Shows payment instructions

### Cart Summary
Always visible on the right side, showing:
- Items you've added
- Quantities
- Running subtotal

### Action Buttons
- **Help**: Request assistance from a store associate
- **Cancel Transaction**: End the transaction and start over
- **Proceed**: Move to the next step

---

## Understanding the Cart Summary

The cart summary panel keeps you informed throughout your transaction:

![Cart Summary](images/cart-summary-wireframe.png)
*The cart summary shows your items and running total*

| Element | Description |
|---------|-------------|
| Item Count | Total number of items in your cart |
| Item List | Scrollable list of products you've scanned |
| Subtotal | Sum of all item prices |
| Discounts | Any loyalty or promotional discounts applied |
| Tax | Calculated tax amount |
| **Total** | Final amount due |

---

## Session Timeout

For security and availability, the kiosk will automatically reset after **2 minutes of inactivity**. You'll see a countdown warning before this happens:

![Timeout Warning](images/timeout-warning-wireframe.png)
*A warning appears before the session times out*

- **30 seconds warning**: A dialog appears asking if you need more time
- **Tap "Continue"**: Resets the timer and continues your transaction
- **No action**: Transaction cancels and returns to welcome screen

---

## Language Selection

The kiosk supports multiple languages. To change the language:

1. Look for the **language icon** in the header bar
2. Tap to see available languages
3. Select your preferred language
4. The interface will update immediately

![Language Selection](images/language-selection-wireframe.png)
*Select your preferred language*

---

## Next Steps

Now that you've started your transaction, you're ready to:

- [Scan your products](scanning-products.md)
- [Manage your cart](cart-management.md)

---

[← Back to Index](index.md) | [Next: Scanning Products →](scanning-products.md)
