# Markdowns & Discounts

Learn how to apply markdowns, understand authorization levels, and handle discount scenarios.

---

## Types of Discounts

### Automatic Discounts

Applied automatically by the system:

| Type | Description | Applied When |
|------|-------------|--------------|
| **Sale Price** | Promotional pricing | Item on sale |
| **Loyalty Price** | Member-only pricing | Customer linked |
| **Promotional Code** | Code-based discount | Valid code entered |
| **Bundle Deal** | Multi-buy discount | Qualifying items in cart |

### Manual Markdowns

Applied by associates (with authorization):

| Type | Use Case | Who Can Apply |
|------|----------|---------------|
| **Damaged Item** | Merchandise has defect | All associates |
| **Price Match** | Competitor has lower price | All associates |
| **Customer Service** | Service recovery | Supervisor+ |
| **Bundle Deal** | Custom bundle not in system | Supervisor+ |
| **Manager Discretion** | Relationship building | Manager+ |
| **Loyalty Exception** | Special member consideration | Manager+ |
| **Override Price** | Set any price | Admin only |

---

## Authorization Levels

### Associate Level

| Markdown Type | Max Discount |
|---------------|--------------|
| Damaged Item | 15% or $50 |
| Price Match | 15% or $50 |

### Supervisor Level

| Markdown Type | Max Discount |
|---------------|--------------|
| All associate types | 25% or $100 |
| Customer Service | 25% or $100 |
| Bundle Deal | 25% or $100 |

### Manager Level

| Markdown Type | Max Discount |
|---------------|--------------|
| All lower types | 50% or $500 |
| Manager Discretion | 50% or $500 |
| Loyalty Exception | 50% or $500 |

### Admin Level

| Markdown Type | Max Discount |
|---------------|--------------|
| All types | Unlimited |
| Override Price | Any price |

---

## Applying a Markdown

### Step 1: Select the Item

1. Click the item in the cart, or
2. Use arrow keys to select
3. Selected item is highlighted

### Step 2: Open Markdown Dialog

1. Click **"Apply Markdown"** on selected item, or
2. Press **F6**, or
3. Right-click → "Apply Markdown"

![Markdown Dialog](images/markdown-dialog-wireframe.png)
*The markdown dialog*

### Step 3: Choose Markdown Type

```
┌─────────────────────────────────────────────────────────────┐
│  Apply Markdown                                      [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Item: Wireless Mouse Pro - Black                          │
│  Current Price: $49.99                                      │
│                                                             │
│  SELECT MARKDOWN TYPE                                       │
│                                                             │
│  ○ Damaged Item                                             │
│    Merchandise has visible defect or damage                 │
│                                                             │
│  ○ Price Match                                              │
│    Match competitor's advertised price                      │
│                                                             │
│  ○ Customer Service                          🔒 Supervisor  │
│    Service recovery for customer issue                      │
│                                                             │
│  ○ Manager Discretion                        🔒 Manager     │
│    Special circumstance (document reason)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 4: Enter Discount Amount

Choose percentage or fixed amount:

```
┌─────────────────────────────────────────────────────────────┐
│  Apply Markdown: Damaged Item                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current Price: $49.99                                      │
│                                                             │
│  DISCOUNT TYPE                                              │
│  ● Percentage     ○ Fixed Amount                           │
│                                                             │
│  Amount                                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 15                                                  % │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Quick amounts: [5%] [10%] [15%] [20%] [25%]               │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Original:      $49.99                                │ │
│  │  Discount:      -$7.50  (15%)                         │ │
│  │  New Price:     $42.49                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Your limit: 15% or $50 (whichever is less)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 5: Document Reason

Required for all markdowns:

```
┌─────────────────────────────────────────────────────────────┐
│  Reason for Markdown                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Small scratch on bottom of mouse. Customer accepted   │ │
│  │ item with 15% discount.                               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Cancel]                              [Apply Markdown]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Manager Approval Workflow

When a markdown exceeds your authority level:

### Requesting Approval

```
┌─────────────────────────────────────────────────────────────┐
│  Manager Approval Required                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ This markdown exceeds your authorization level.          │
│                                                             │
│  Markdown Type:    Customer Service                         │
│  Requested Amount: 20% ($10.00)                            │
│  Your Limit:       15% ($7.50)                             │
│                                                             │
│  A manager must authorize this markdown.                    │
│                                                             │
│  Options:                                                   │
│                                                             │
│  [Request Manager Override]                                 │
│    Manager enters credentials at this terminal              │
│                                                             │
│  [Send for Approval]                                        │
│    Manager approves remotely (transaction suspended)        │
│                                                             │
│  [Reduce to My Limit]                                       │
│    Apply 15% instead                                        │
│                                                             │
│  [Cancel]                                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Manager Override (At Terminal)

Manager authenticates at the terminal:

```
┌─────────────────────────────────────────────────────────────┐
│  Manager Authorization                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Markdown Request                                           │
│  Type:     Customer Service                                 │
│  Item:     Wireless Mouse Pro - Black                      │
│  Amount:   20% ($10.00)                                    │
│  Reason:   Customer received wrong color initially,         │
│            accepting current item with discount.            │
│                                                             │
│  Manager Credentials                                        │
│                                                             │
│  Employee ID                                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Password                                                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Cancel]                              [Authorize]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Remote Approval

Manager approves from their workstation:

```
┌─────────────────────────────────────────────────────────────┐
│  PENDING APPROVAL REQUEST                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  From: John D. (Associate) - Register 3                    │
│  Time: 2:45 PM                                              │
│                                                             │
│  Transaction #12346                                         │
│  Customer: Mary Smith                                       │
│                                                             │
│  REQUEST                                                    │
│  Markdown Type:    Customer Service                         │
│  Item:             Wireless Mouse Pro - Black ($49.99)     │
│  Requested:        20% discount ($10.00)                   │
│  Reason:           Customer received wrong color initially, │
│                    accepting with discount.                 │
│                                                             │
│  [Approve]  [Modify Amount]  [Deny]  [Request More Info]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Price Match

### Qualifying for Price Match

Price match policy requirements:
- Competitor must be authorized (major retailers)
- Identical item (same SKU/model)
- Item must be in stock at competitor
- Must be current advertised price
- Some exclusions apply (clearance, membership prices)

### Processing Price Match

1. Select item in cart
2. Press **F6** or click **"Apply Markdown"**
3. Select **"Price Match"**
4. Enter competitor information:

```
┌─────────────────────────────────────────────────────────────┐
│  Price Match                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Our Price: $49.99                                          │
│                                                             │
│  Competitor Name *                                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Best Buy                                           ▼ │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Competitor Price *                                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ $44.99                                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Proof Type *                                               │
│  ○ Ad/Flyer     ○ Website     ○ App                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Price Match:   -$5.00                                │ │
│  │  New Price:     $44.99                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Cancel]                              [Apply Price Match]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Promotional Codes

### Entering a Promo Code

1. Click **"Add Promo Code"** in cart, or press **F9**
2. Enter the code
3. Click **"Apply"**

```
┌─────────────────────────────────────────────────────────────┐
│  Enter Promo Code                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ SAVE20                                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Cancel]                              [Apply Code]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Valid Code

```
┌─────────────────────────────────────┐
│  ✓ Code Applied: SAVE20            │
│                                     │
│  20% off entire purchase           │
│  Discount: -$27.05                  │
│                                     │
│  [OK]                               │
└─────────────────────────────────────┘
```

### Invalid Code

```
┌─────────────────────────────────────┐
│  ✗ Code Invalid: BADCODE           │
│                                     │
│  This code is not recognized.       │
│  Please check and try again.        │
│                                     │
│  [Try Again]  [Cancel]              │
└─────────────────────────────────────┘
```

### Code Limitations

| Error | Meaning |
|-------|---------|
| "Code expired" | Promotion has ended |
| "Code already used" | Single-use code redeemed |
| "Minimum not met" | Cart total too low |
| "Items not eligible" | Products excluded from promo |
| "Cannot combine" | Already have another code |

---

## Cart Discount Display

Applied discounts show in cart:

```
┌────────────────────────────────────────────────────────────┐
│  CART (3 items)                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Wireless Mouse Pro - Black                                │
│  $49.99                                                    │
│  💰 Damaged Item: -$7.50 (15%)                            │
│  Line total: $42.49                                        │
│                                                            │
│  USB Cable 6ft                                             │
│  $14.99                                                    │
│                                                            │
│  Mouse Pad                                                 │
│  $19.99  $14.99 (SALE)                                    │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  Subtotal                                       $72.47    │
│  Promo: SAVE20                                 -$14.49    │
│  Tax                                             $4.78    │
│  ────────────────────────────────────────────────────     │
│  TOTAL                                          $62.76    │
└────────────────────────────────────────────────────────────┘
```

---

## Removing Discounts

### Remove Item Markdown

1. Click the discount on the item
2. Select **"Remove Markdown"**
3. Confirm removal

### Remove Promo Code

1. Click the promo code in cart summary
2. Click **"Remove"**
3. Code is removed, price adjusts

---

## Markdown Policies

### When to Apply Markdowns

| Situation | Appropriate Action |
|-----------|-------------------|
| Damaged packaging | Damaged Item markdown |
| Missing accessory | Damaged Item markdown |
| Competitor lower price | Price Match |
| Customer complaint | Customer Service (supervisor) |
| Loyalty member upset | Loyalty Exception (manager) |
| Building relationship | Manager Discretion |

### When NOT to Apply Markdowns

| Situation | Why Not |
|-----------|---------|
| Customer just asking | Must have valid reason |
| Already on sale | Double discount not allowed |
| Clearance item | Already marked down |
| Price label error | Not customer's fault - honor it |

---

## Markdown Audit Trail

All markdowns are logged with:
- Date/time
- Associate who applied
- Manager who authorized (if applicable)
- Markdown type and reason
- Original and new price
- Transaction number

Managers can review markdown reports for their team.

---

## Best Practices

### Documentation

- **Be specific** in reasons ("small scratch" not "damaged")
- **Note customer agreement** ("customer accepted item with discount")
- **Reference policy** when applicable

### Authority

- **Know your limits** - check before promising discount
- **Get approval first** - don't make customer wait
- **Escalate appropriately** - don't ask admin for supervisor issues

### Customer Service

- **Explain limitations** - "I can do 15%, let me get a manager for more"
- **Be consistent** - same situation, same discount
- **Document exceptions** - protects you and the customer

---

## Next Steps

- [Customer Management](customer-management.md)
- [Order Management](order-management.md)
- [B2B Pricing](b2b-transactions.md#b2b-pricing)

---

[← Payment Processing](payment-processing.md) | [Back to Index](index.md) | [Next: Customer Management →](customer-management.md)
