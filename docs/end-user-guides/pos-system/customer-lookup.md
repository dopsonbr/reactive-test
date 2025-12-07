# Customer Lookup

Learn how to find and link customers to transactions.

---

## Why Link Customers?

Linking a customer to a transaction enables:

| Benefit | Description |
|---------|-------------|
| **Loyalty Points** | Customer earns rewards on purchase |
| **Member Pricing** | Automatic loyalty discounts |
| **Purchase History** | Transaction saved to customer profile |
| **Easy Returns** | Return without receipt lookup |
| **Email Receipt** | Send receipt to customer's email |
| **B2B Pricing** | Business customer special rates |

---

## Quick Customer Lookup

### From Transaction Screen

1. Click **"Link Customer"** or press **F3**
2. Enter search criteria
3. Select matching customer
4. Customer is linked to transaction

![Customer Search](images/customer-search-wireframe.png)
*Customer lookup dialog*

### Search Methods

```
┌─────────────────────────────────────────────────────────────┐
│  Find Customer                                       [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 Search by phone, email, name, or customer ID            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 555-123-4567                                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Quick Search Options:                                      │
│  [📱 Phone]  [✉️ Email]  [👤 Name]  [🏢 Business]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Method | Format | Example |
|--------|--------|---------|
| **Phone** | 10 digits | 555-123-4567 |
| **Email** | Full email | john@email.com |
| **Name** | First Last | John Smith |
| **Customer ID** | 8 digits | 12345678 |
| **Loyalty Card** | Scan barcode | (scan card) |

---

## Search Results

### Single Match

When one customer matches, they're shown immediately:

```
┌─────────────────────────────────────────────────────────────┐
│  Customer Found                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  John Smith                                   │
│  │         │  📱 (555) 123-4567                            │
│  │  👤     │  ✉️ john.smith@email.com                      │
│  │         │                                                │
│  └─────────┘  Customer ID: 12345678                        │
│               Member since: March 2020                      │
│                                                             │
│  LOYALTY STATUS                                             │
│  ⭐ Gold Member • 2,450 points                             │
│  Available Rewards: $25 off coupon                         │
│                                                             │
│  [View Profile]           [Use This Customer]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Multiple Matches

When several customers match, select the correct one:

```
┌─────────────────────────────────────────────────────────────┐
│  Multiple Results (3 found)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ○ John Smith                                          │ │
│  │   📱 (555) 123-4567 • ✉️ john.smith@email.com         │ │
│  │   Customer ID: 12345678 • Gold Member                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ○ John Smith Jr.                                      │ │
│  │   📱 (555) 123-9999 • ✉️ jsmith.jr@email.com          │ │
│  │   Customer ID: 12345999 • Silver Member               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ○ Johnny Smith                                        │ │
│  │   📱 (555) 987-6543 • ✉️ johnny.s@work.com            │ │
│  │   Customer ID: 87654321 • Basic Member                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Cancel]                              [Select Customer]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### No Match Found

When no customer is found:

```
┌─────────────────────────────────────────────────────────────┐
│  No Customer Found                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  We couldn't find a customer matching:                      │
│  "555-000-0000"                                             │
│                                                             │
│  Would you like to:                                         │
│                                                             │
│  [🔍 Try Different Search]                                  │
│                                                             │
│  [➕ Create New Customer]                                    │
│                                                             │
│  [✓ Continue as Guest]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Linked Customer Display

Once linked, the customer appears in the transaction header:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Transaction #12346                    Customer: John Smith (Gold ⭐)   │
│                                         [View] [Change] [Remove]        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Customer Quick Actions

| Action | Description |
|--------|-------------|
| **View** | Open customer profile sheet |
| **Change** | Search for different customer |
| **Remove** | Unlink customer from transaction |

---

## Customer Quick View

Click **"View"** to see customer details without leaving the transaction:

![Customer Quick View](images/customer-quickview-wireframe.png)
*Customer quick view slide-out panel*

```
┌────────────────────────────────────────┐
│  CUSTOMER                        [X]  │
├────────────────────────────────────────┤
│                                        │
│  ┌────────┐  John Smith               │
│  │   👤   │  Gold Member ⭐           │
│  └────────┘                           │
│                                        │
│  CONTACT                               │
│  📱 (555) 123-4567                     │
│  ✉️ john.smith@email.com               │
│  🏠 123 Main St, Anytown, ST 12345    │
│                                        │
│  LOYALTY                               │
│  Points Balance: 2,450                 │
│  Lifetime Points: 15,230               │
│  Member Since: March 2020              │
│                                        │
│  AVAILABLE REWARDS                     │
│  • $25 off purchase of $100+          │
│  • Free shipping on next order        │
│                                        │
│  RECENT PURCHASES                      │
│  Dec 5 - $125.99 - Electronics        │
│  Nov 28 - $89.50 - Home Goods         │
│  Nov 15 - $234.00 - Appliances        │
│                                        │
│  [View Full Profile]  [Apply Reward]   │
│                                        │
└────────────────────────────────────────┘
```

---

## B2B Customers

### Identifying Business Customers

Business customers have additional indicators:

```
┌───────────────────────────────────────────────────────────┐
│  🏢 Acme Corporation                                      │
│     Business Account • Net 30 Terms                        │
│     Account #: B-12345678                                  │
│                                                            │
│     Primary Contact: Jane Doe                              │
│     📱 (555) 987-6543 • ✉️ jane@acme.com                   │
│                                                            │
│     Credit Limit: $50,000                                  │
│     Available Credit: $35,450                              │
│                                                            │
│     [View Account]          [Select Account]               │
└───────────────────────────────────────────────────────────┘
```

### B2B Account Hierarchy

Some B2B customers have hierarchical accounts:

```
┌─────────────────────────────────────────────────────────────┐
│  Select Account Level                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🏢 Acme Corporation (Parent)                               │
│     Account #: B-12345678                                   │
│     ├── 📍 Acme - Downtown Location                        │
│     │   Sub-Account #: B-12345678-001                      │
│     ├── 📍 Acme - Airport Branch                           │
│     │   Sub-Account #: B-12345678-002                      │
│     └── 📍 Acme - Mall Store                               │
│         Sub-Account #: B-12345678-003                      │
│                                                             │
│  Select which account this order is for:                    │
│                                                             │
│  ○ Parent Account (Acme Corporation)                        │
│  ○ Acme - Downtown Location                                 │
│  ○ Acme - Airport Branch                                    │
│  ○ Acme - Mall Store                                        │
│                                                             │
│  [Cancel]                              [Select]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

See [B2B Transactions](b2b-transactions.md) for complete B2B features.

---

## Loyalty Card Scan

Customers with physical loyalty cards can be quickly looked up:

1. Click **"Link Customer"** or press **F3**
2. Scan the loyalty card barcode
3. Customer is automatically found and linked

![Loyalty Card](images/loyalty-card-wireframe.png)
*Scan the loyalty card barcode*

---

## Quick Customer Creation

If a customer isn't found and wants to sign up:

### Minimal Registration

For quick sign-up during checkout:

1. Click **"Create New Customer"**
2. Enter required fields only:
   - Phone number
   - First name
   - Last name
3. Click **"Create & Link"**

```
┌─────────────────────────────────────────────────────────────┐
│  Quick Customer Registration                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phone Number *                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ (555) 000-0000                                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  First Name *               Last Name *                     │
│  ┌────────────────────┐    ┌────────────────────┐         │
│  │                    │    │                    │         │
│  └────────────────────┘    └────────────────────┘         │
│                                                             │
│  Email (optional)                                           │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ☐ Customer consents to receive promotional emails         │
│                                                             │
│  [Cancel]                              [Create & Link]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Full Registration

For complete profile creation:

1. Click **"Create New Customer"**
2. Click **"Full Registration"**
3. Enter all customer details
4. Click **"Save & Link"**

See [Customer Management](customer-management.md) for full registration details.

---

## Applying Customer Rewards

When a customer has available rewards:

1. Link customer to transaction
2. Notice **"Available Rewards"** badge
3. Click to view rewards
4. Select rewards to apply
5. Rewards are added to cart

```
┌─────────────────────────────────────────────────────────────┐
│  Available Rewards for John Smith                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ☐ $25 off purchase of $100+                               │
│    Expires: Dec 31, 2024                                    │
│    Current cart qualifies ✓                                 │
│                                                             │
│  ☐ Free shipping on next order                              │
│    Expires: Jan 15, 2025                                    │
│    Only valid for delivery orders                           │
│                                                             │
│  ☐ 2X points on electronics                                 │
│    Expires: Dec 15, 2024                                    │
│    Electronics in cart: Yes ✓                               │
│                                                             │
│  [Cancel]                              [Apply Selected]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Guest Checkout

Customers can checkout without linking an account:

- No loyalty points earned
- No purchase history saved
- Standard pricing only
- Receipt goes to provided email (if requested)

To proceed as guest:
1. Skip customer lookup, or
2. Click **"Continue as Guest"** when prompted

---

## Search Tips

### Finding Customers Quickly

| Tip | Why It Works |
|-----|--------------|
| **Use phone number** | Most unique identifier |
| **Partial search** | System searches partial matches |
| **Check spelling** | Common issue with name search |
| **Try email** | More reliable than name |

### Common Issues

| Issue | Solution |
|-------|----------|
| "Too many results" | Add more search criteria |
| "No results" | Try different search method |
| "Wrong customer" | Verify with customer before selecting |

---

## Changing Linked Customer

To switch to a different customer mid-transaction:

1. Click **"Change"** next to customer name
2. Search for correct customer
3. Select new customer
4. Previous customer is unlinked

**Note:** Loyalty rewards from previous customer are removed.

---

## Removing Linked Customer

To remove customer and continue as guest:

1. Click **"Remove"** next to customer name
2. Confirm removal
3. Transaction continues without customer link

```
┌─────────────────────────────────────────┐
│  Remove Customer?                       │
│                                         │
│  John Smith will be unlinked from       │
│  this transaction.                      │
│                                         │
│  • Loyalty points will not be earned    │
│  • Member pricing will be removed       │
│  • Applied rewards will be removed      │
│                                         │
│  [Keep Customer]       [Remove]         │
└─────────────────────────────────────────┘
```

---

## Next Steps

- [Configure Fulfillment](fulfillment-options.md)
- [Manage Customer Profiles](customer-management.md)
- [Process Payment](payment-processing.md)

---

[← Transaction Basics](transaction-basics.md) | [Back to Index](index.md) | [Next: Fulfillment Options →](fulfillment-options.md)
