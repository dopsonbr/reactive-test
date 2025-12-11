# Payment

Learn how to process card and cash payments and complete transactions.

---

## Payment Screen Overview

After tapping **[Pay]** from the cart, you'll see:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFLINE POS                    │  Operator: 1234  │  [🔴 Offline]  [🚪]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PAYMENT                                                                 │
│                                                                          │
│              ┌────────────────────────────────────┐                     │
│              │                                    │                     │
│              │         Total: $39.16              │                     │
│              │                                    │                     │
│              └────────────────────────────────────┘                     │
│                                                                          │
│              [        Pay with Card        ]                            │
│                                                                          │
│              [        Pay with Cash        ]                            │
│                                                                          │
│                                                                          │
│                        Back to Cart                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Payment Methods

The Offline POS supports two payment methods:

| Method | Description |
|--------|-------------|
| **Card** | Credit/debit via connected terminal |
| **Cash** | Manual cash handling |

---

## Paying with Card

### Step 1: Start Card Payment

1. Tap **[Pay with Card]**
2. The screen shows "Insert or tap card..."

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  PAYMENT                                                                 │
│                                                                          │
│              ┌────────────────────────────────────┐                     │
│              │                                    │                     │
│              │         Total: $39.16              │                     │
│              │                                    │                     │
│              │    Insert or tap card...          │                     │
│              │                                    │                     │
│              └────────────────────────────────────┘                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Customer Inserts/Taps Card

Instruct the customer to:
- **Insert chip** - Push card into reader, leave until prompted
- **Tap contactless** - Hold card/phone near reader
- **Swipe** - (If chip fails) Slide through magnetic reader

### Step 3: Wait for Authorization

The terminal processes the payment. Status updates show progress:

```
Processing payment...
```

### Step 4: Payment Result

**If Approved:**
```
✓ Payment Approved
```
The system automatically advances to the complete screen.

**If Declined:**
```
✗ Payment declined: Insufficient funds
```
Options:
- Try a different card
- Switch to cash
- Return to cart

### Card Payment Flow

```
[Pay with Card]
       │
       ▼
"Insert or tap card..."
       │
       ▼
  Processing...
       │
       ├──── Approved ──→ Complete Screen
       │
       └──── Declined ──→ Try again or switch method
```

---

## Paying with Cash

### Step 1: Start Cash Payment

1. Tap **[Pay with Cash]**
2. Transaction completes immediately

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  PAYMENT                                                                 │
│                                                                          │
│              Total: $39.16                                              │
│                                                                          │
│              [        Pay with Cash        ]                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Collect Cash

**Before tapping [Pay with Cash]:**
1. Collect cash from customer
2. Count it to verify correct amount
3. Calculate change due

### Step 3: Complete and Give Change

1. Tap **[Pay with Cash]**
2. Transaction records as complete
3. Give customer their change
4. Receipt prints automatically

### Cash Handling Tips

| Situation | Action |
|-----------|--------|
| **Exact change** | Tap [Pay with Cash], no change needed |
| **Over-payment** | Calculate change, give to customer |
| **Under-payment** | Ask for remaining amount before completing |

**Note:** The Offline POS does not calculate change for you. Always count cash and calculate manually.

---

## Transaction Complete

After successful payment:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFLINE POS                    │  Operator: 1234  │  [🔴 Offline]  [🚪]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                     TRANSACTION COMPLETE                                 │
│                                                                          │
│                         ✓                                                │
│                                                                          │
│                  Transaction ID:                                         │
│                                                                          │
│                     TXN-20241210-001                                     │
│                                                                          │
│                  Total: $39.16                                          │
│                                                                          │
│              [  New Transaction  ]   [Sign Out]                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### What Happens

1. **Transaction saved** - Stored locally for later sync
2. **Receipt prints** - If printer connected
3. **Transaction ID assigned** - For reference

### Next Actions

| Button | Action |
|--------|--------|
| **[New Transaction]** | Return to scan screen for next customer |
| **[Sign Out]** | Log out if done |

---

## Payment Issues

### Card Declined

| Decline Reason | What to Say | Action |
|----------------|-------------|--------|
| "Insufficient funds" | "The card was declined. Would you like to try another card?" | Try different card or cash |
| "Invalid card" | "I'm having trouble reading the card. Can we try again?" | Re-insert or try different card |
| "Do not honor" | "The bank declined this transaction." | Customer contacts bank, use another method |

### Terminal Not Responding

1. Check terminal is powered on
2. Check connection to POS device
3. Wait 30 seconds and retry
4. If still failing, process as cash (with manager approval)

### No Receipt

If receipt doesn't print:
1. Check printer has paper
2. Check printer connection
3. Note transaction ID for customer
4. Offer to write manual receipt

---

## Offline Payment Processing

**Important:** When operating offline, card payments work differently:

| Status | Card Behavior |
|--------|---------------|
| **Online** | Real-time authorization from bank |
| **Offline** | Store-and-forward (limited) |

### Offline Card Limits

When offline, card payments may be:
- **Limited to certain amount** (typically $50-100)
- **Subject to later approval** (may be declined during sync)
- **Cash preferred** for larger transactions

**Always inform customers:** "We're in backup mode. For larger purchases, cash is preferred."

---

## Receipt Options

The Offline POS prints receipts automatically. Receipt includes:

```
┌─────────────────────────────────────┐
│         STORE NAME                  │
│       123 Main Street               │
│       City, ST 12345                │
├─────────────────────────────────────┤
│  Transaction: TXN-20241210-001      │
│  Date: 12/10/2024 2:35 PM           │
│  Operator: 1234                     │
├─────────────────────────────────────┤
│  Premium Coffee 12oz     2   $25.98 │
│  Whole Milk 1 Gallon     1    $4.29 │
│  Organic Eggs 12ct       1    $5.99 │
├─────────────────────────────────────┤
│  Subtotal                   $36.26  │
│  Tax                         $2.90  │
│  TOTAL                      $39.16  │
├─────────────────────────────────────┤
│  Payment: CARD                      │
│  Auth: ****1234                     │
├─────────────────────────────────────┤
│       Thank you for shopping!       │
│      ** OFFLINE TRANSACTION **      │
└─────────────────────────────────────┘
```

**Note:** Offline receipts are marked with "OFFLINE TRANSACTION" to indicate they will be synced later.

---

## Quick Reference

### Payment Flow

```
Cart → [Pay] → Payment Screen → [Card/Cash] → Complete → [New Transaction]
```

### Button Summary

| Button | What It Does |
|--------|--------------|
| **[Pay with Card]** | Initiates card terminal |
| **[Pay with Cash]** | Records cash sale immediately |
| **[Back to Cart]** | Return to modify items |
| **[New Transaction]** | Start next sale |
| **[Sign Out]** | End session |

---

## Best Practices

### Before Payment
- [ ] Confirm total with customer
- [ ] Ask "Cash or card?"
- [ ] Have receipt printer ready

### For Card Payments
- [ ] Watch for authorization message
- [ ] Handle declines professionally
- [ ] Offer alternative if declined

### For Cash Payments
- [ ] Collect cash before tapping [Pay with Cash]
- [ ] Count cash received
- [ ] Calculate and give correct change

### After Payment
- [ ] Hand receipt to customer
- [ ] Thank customer
- [ ] Start next transaction or sign out

---

## Next Steps

If you encounter issues:

- [Troubleshooting](troubleshooting.md) - Common problems and solutions

---

[← Cart Management](cart-management.md) | [Back to Index](index.md) | [Next: Troubleshooting →](troubleshooting.md)
