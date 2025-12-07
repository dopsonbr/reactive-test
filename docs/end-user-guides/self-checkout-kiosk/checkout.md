# Checkout & Payment

Complete your purchase with our simple payment process.

---

## Payment Overview

After reviewing your cart and optionally linking your loyalty account, you'll reach the payment screen.

![Payment Screen](images/payment-screen-wireframe.png)
*The payment screen shows your total and payment options*

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    Complete Payment                         │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │                      │  │  YOUR TOTAL              │   │
│  │   Select Payment     │  │                          │   │
│  │   Method             │  │  Subtotal     $45.97    │   │
│  │                      │  │  Discounts    -$5.00    │   │
│  │  ┌────────────────┐  │  │  Tax           $3.28    │   │
│  │  │  💳 Credit     │  │  │  ────────────────────   │   │
│  │  └────────────────┘  │  │                          │   │
│  │  ┌────────────────┐  │  │  TOTAL        $44.25    │   │
│  │  │  💳 Debit      │  │  │                          │   │
│  │  └────────────────┘  │  │                          │   │
│  │  ┌────────────────┐  │  │                          │   │
│  │  │  📱 Mobile Pay │  │  │                          │   │
│  │  └────────────────┘  │  │                          │   │
│  │                      │  │                          │   │
│  └──────────────────────┘  └──────────────────────────┘   │
│                                                             │
│               [← Back to Cart]    [Cancel]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Payment Methods

### Credit Card

Accept all major credit cards:
- Visa
- Mastercard
- American Express
- Discover

![Credit Card Payment](images/credit-card-wireframe.png)
*Insert, tap, or swipe your credit card*

**How to pay:**
1. Tap **"Credit"** on screen
2. Follow the prompts on the card reader
3. Insert, tap, or swipe your card
4. Enter PIN or sign if prompted

### Debit Card

Pay directly from your bank account:

![Debit Card Payment](images/debit-card-wireframe.png)
*Use your debit card with PIN*

**How to pay:**
1. Tap **"Debit"** on screen
2. Insert or swipe your debit card
3. Enter your PIN on the card reader keypad
4. Select account type if prompted (checking/savings)

### Mobile Payment

Use your smartphone or smartwatch:
- Apple Pay
- Google Pay
- Samsung Pay

![Mobile Payment](images/mobile-pay-wireframe.png)
*Hold your device near the reader*

**How to pay:**
1. Tap **"Mobile Pay"** on screen
2. Prepare your phone (Face ID, fingerprint, or passcode)
3. Hold your device near the contactless reader
4. Wait for confirmation

---

## Using the Card Reader

The card reader is located next to the screen with multiple payment options:

```
┌─────────────────────────────────┐
│         CARD READER             │
│                                 │
│    ┌─────────────────────┐     │
│    │   📶 TAP HERE       │     │
│    │   (Contactless)     │     │
│    └─────────────────────┘     │
│                                 │
│    ═══════════════════════     │
│    ▶ INSERT CHIP HERE          │
│    ═══════════════════════     │
│                                 │
│    ─────────────────────────   │
│    ↔ SWIPE MAGNETIC STRIP      │
│    ─────────────────────────   │
│                                 │
│    ┌─────┬─────┬─────┐         │
│    │  1  │  2  │  3  │  PIN    │
│    ├─────┼─────┼─────┤  PAD    │
│    │  4  │  5  │  6  │         │
│    ├─────┼─────┼─────┤         │
│    │  7  │  8  │  9  │         │
│    ├─────┼─────┼─────┤         │
│    │  *  │  0  │  #  │         │
│    └─────┴─────┴─────┘         │
└─────────────────────────────────┘
```

![Card Reader](images/card-reader-wireframe.png)
*The card reader supports multiple payment types*

### Card Reader Options

| Method | How To |
|--------|--------|
| **Tap** | Hold contactless card or phone near the reader |
| **Insert** | Put chip end of card into the slot |
| **Swipe** | Slide magnetic stripe through the reader |

### PIN Entry

For debit cards or when prompted:
1. Shield the keypad with your hand
2. Enter your 4-digit PIN
3. Press the green **Enter** button
4. Wait for approval

---

## Payment Processing

After providing payment, you'll see processing screens:

### Processing

![Processing Payment](images/processing-wireframe.png)
*Payment is being processed*

```
┌─────────────────────────────────────┐
│                                     │
│         Processing Payment          │
│                                     │
│              ⏳                      │
│                                     │
│      Please wait...                 │
│      Do not remove your card        │
│                                     │
└─────────────────────────────────────┘
```

**Important:**
- Keep your card inserted until prompted
- Don't tap the screen during processing
- Wait for the confirmation beep

### Approved

![Payment Approved](images/approved-wireframe.png)
*Your payment was successful*

```
┌─────────────────────────────────────┐
│                                     │
│            ✓ Approved               │
│                                     │
│      Transaction Complete           │
│                                     │
│      Amount: $44.25                 │
│      Card: ****1234                 │
│                                     │
│      Remove your card               │
│                                     │
└─────────────────────────────────────┘
```

---

## Receipt Options

After payment approval, choose your receipt preference:

![Receipt Options](images/receipt-options-wireframe.png)
*Choose how to receive your receipt*

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                 How would you like your receipt?            │
│                                                             │
│   ┌─────────────────┐  ┌─────────────────┐  ┌───────────┐ │
│   │                 │  │                 │  │           │ │
│   │   🖨️ Print     │  │   📧 Email     │  │  ❌ None  │ │
│   │                 │  │                 │  │           │ │
│   └─────────────────┘  └─────────────────┘  └───────────┘ │
│                                                             │
│            [Print + Email Both]                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Receipt Options

| Option | Description |
|--------|-------------|
| **Print** | Paper receipt prints at the kiosk |
| **Email** | Digital receipt sent to your loyalty email |
| **None** | No receipt (transaction still recorded) |
| **Both** | Print and email |

### Printed Receipt

The receipt prints from the slot below the screen:

![Receipt Printer](images/receipt-printer-wireframe.png)
*Take your printed receipt*

**Receipt includes:**
- Store name and address
- Transaction date and time
- All items purchased with prices
- Discounts applied
- Payment method (last 4 digits)
- Total paid
- Loyalty points earned (if applicable)

### Email Receipt

If you linked your loyalty account, the email receipt goes to your registered email address.

If you didn't link an account but want email:
1. Select **"Email"**
2. Enter your email address
3. Tap **"Send"**

---

## Transaction Complete

After selecting your receipt option:

![Transaction Complete](images/complete-wireframe.png)
*Your transaction is complete*

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                  🎉 Thank You!                              │
│                                                             │
│              Your transaction is complete.                  │
│                                                             │
│              ┌─────────────────────────┐                   │
│              │  Transaction #: 789456  │                   │
│              │  Total: $44.25          │                   │
│              │  Points Earned: 44      │                   │
│              └─────────────────────────┘                   │
│                                                             │
│              Don't forget your:                             │
│              • Receipt (if printed)                         │
│              • Card                                         │
│              • Purchases                                    │
│                                                             │
│              [Start New Transaction]                        │
│                                                             │
│              Screen will reset in 10 seconds...            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Before You Leave

Remember to take:
- ✅ Your **payment card**
- ✅ Your **printed receipt** (if applicable)
- ✅ All your **purchased items**
- ✅ Any **coupons** that printed

---

## Payment Declined

If your payment is declined:

![Payment Declined](images/declined-wireframe.png)
*Payment was not approved*

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                  ✗ Payment Declined                         │
│                                                             │
│   Your payment could not be processed.                      │
│                                                             │
│   This could be because:                                    │
│   • Insufficient funds                                      │
│   • Card expired                                            │
│   • Daily limit reached                                     │
│   • Card blocked for security                               │
│                                                             │
│   ┌─────────────────┐  ┌─────────────────┐                │
│   │  Try Again      │  │  Different Card │                │
│   └─────────────────┘  └─────────────────┘                │
│                                                             │
│                   [Cancel Transaction]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### What to Do

1. **Try Again** - Sometimes a retry works
2. **Use Different Card** - Try another payment method
3. **Check with Bank** - Your bank may have blocked the transaction
4. **Request Help** - A store associate can assist

---

## Split Payment

Self-checkout kiosks support single payment method only. If you need to split payment across multiple cards:

1. Press **"Help"** to request assistance
2. A store associate can process split payments

---

## Coupons and Promo Codes

### Entering Promo Codes

If you have a promotional code:

1. Look for **"Add Promo Code"** on the cart review screen
2. Enter the code using the on-screen keyboard
3. Tap **"Apply"**
4. Discount appears in cart summary

![Promo Code Entry](images/promo-code-wireframe.png)
*Enter promotional codes before payment*

### Paper Coupons

Paper coupons require associate assistance:
1. Press **"Help"** button
2. Show your coupon to the associate
3. They will apply the discount

### Digital Coupons

If you have digital coupons on your loyalty account:
- Link your account during checkout
- Eligible coupons apply automatically

---

## Security Tips

### Protect Your PIN
- Shield the keypad when entering your PIN
- Don't share your PIN with anyone
- The kiosk never asks for your full card number on screen

### Card Safety
- Never leave your card in the reader
- Verify the amount before confirming payment
- Take your receipt for your records

### Suspicious Activity
If you notice anything unusual:
- Press **"Help"** immediately
- Do not complete the transaction
- Notify a store associate

---

## Next Steps

If you encounter any issues:
- [Troubleshooting Guide](troubleshooting.md)

---

[← Loyalty Account](loyalty-account.md) | [Back to Index](index.md) | [Next: Troubleshooting →](troubleshooting.md)
