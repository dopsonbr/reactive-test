# Getting Started

Learn how to access the Offline POS, log in, and navigate the interface.

---

## Accessing the Offline POS

### Step 1: Locate the Terminal

The Offline POS runs on a dedicated backup terminal, typically:
- Located in the manager's office or back room
- A tablet or laptop with the Offline POS application installed
- Connected to receipt printer and card terminal

### Step 2: Open the Application

The Offline POS opens automatically when the device starts. If needed:

1. Double-click the **Offline POS** icon on the desktop
2. Or open the browser and navigate to `http://localhost:3000`

---

## Logging In

### Step 1: Enter Your PIN

The login screen prompts for your operator PIN:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                           OFFLINE POS                                    │
│                                                                          │
│                      ┌─────────────────────┐                            │
│                      │                     │                            │
│                      │    Operator Login   │                            │
│                      │                     │                            │
│                      │    Enter PIN        │                            │
│                      │    ┌─────────────┐  │                            │
│                      │    │  ● ● ● ●    │  │                            │
│                      │    └─────────────┘  │                            │
│                      │                     │                            │
│                      │    [  Sign In  ]    │                            │
│                      │                     │                            │
│                      └─────────────────────┘                            │
│                                                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

1. Enter your **4-6 digit PIN** using the number keys
2. Press **Enter** or tap **Sign In**

### Step 2: Verify Login

After successful login, you'll see the scan screen with your operator ID in the header:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFLINE POS                    │  Operator: 1234  │  [🔴 Offline]  [🚪]│
└─────────────────────────────────────────────────────────────────────────┘
```

### Login Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid PIN" | Wrong PIN entered | Re-enter correct PIN |
| "Operator not found" | PIN not in local database | Contact manager |
| "Too many attempts" | Multiple failed logins | Wait 5 minutes, retry |

---

## Understanding the Header

The header bar appears on every screen:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFLINE POS        │  Operator: 1234  │  [🔴 Offline - 3 pending]  [🚪]│
└─────────────────────────────────────────────────────────────────────────┘
```

| Element | Description |
|---------|-------------|
| **OFFLINE POS** | Application name |
| **Operator** | Your operator ID |
| **Status Indicator** | Connection status and pending count |
| **Sign Out** 🚪 | Log out of the system |

---

## Status Indicators

### Connection Status

| Status | Display | Meaning |
|--------|---------|---------|
| 🟢 **Online** | `[🟢 Online]` | Connected to central systems |
| 🔴 **Offline** | `[🔴 Offline]` | No connection - transactions stored locally |
| 🟡 **Syncing** | `[🟡 Syncing...]` | Uploading pending transactions |

### Pending Transactions

When offline, the status shows how many transactions are waiting to sync:

```
[🔴 Offline - 5 pending]
```

This number decreases as transactions sync when connectivity returns.

---

## Navigation

The Offline POS uses a linear flow - you move forward through each step of a transaction:

```
Login → Scan → Cart → Payment → Complete → (Back to Scan)
```

### Moving Between Steps

| Action | How |
|--------|-----|
| **Next Step** | Use the primary action button |
| **Previous Step** | Use the "Back" link or secondary button |
| **New Transaction** | Complete current or use "New Transaction" |

### Primary Action Buttons

Each screen has a primary action that advances to the next step:

| Screen | Primary Action |
|--------|----------------|
| Scan | View Cart |
| Cart | Pay |
| Payment | (Payment completes automatically) |
| Complete | New Transaction |

---

## The Scan Screen

After login, you'll see the main scanning interface:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFLINE POS                    │  Operator: 1234  │  [🔴 Offline]  [🚪]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │                    SCAN BARCODE OR SEARCH                        │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🔍 Search by name or UPC...                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│                        [  View Cart (0)  ]                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Screen Elements

| Element | Purpose |
|---------|---------|
| **Scan Area** | Indicates where to scan barcodes |
| **Search Box** | Type to search for products by name or UPC |
| **View Cart** | Shows item count and navigates to cart |

---

## Signing Out

### When to Sign Out

- End of your shift
- Taking a break
- Handing off to another operator

### How to Sign Out

1. Complete or void any active transaction
2. Click the **Sign Out** icon (🚪) in the header
3. Confirm when prompted

### Important Notes

- **Check pending transactions** before signing out
- If transactions are pending, notify the next operator or manager
- Never leave the terminal logged in unattended

---

## Quick Reference

### Keyboard Shortcuts

| Action | Key |
|--------|-----|
| Focus search | `/` |
| Submit form | `Enter` |
| Go back | `Escape` |

### Transaction Flow

| Step | Screen | Action |
|------|--------|--------|
| 1 | Login | Enter PIN |
| 2 | Scan | Add items to cart |
| 3 | Cart | Review and adjust |
| 4 | Payment | Process payment |
| 5 | Complete | Print receipt, start next |

---

## First Use Checklist

Before your first transaction:

- [ ] Successfully logged in with your PIN
- [ ] Noted the connectivity status
- [ ] Verified receipt printer is working
- [ ] Know how to search for products
- [ ] Know where to get help if needed

---

## Next Steps

Now that you're logged in, learn how to:

- [Scan items](scanning-items.md)
- [Manage the cart](cart-management.md)

---

[← Back to Index](index.md) | [Next: Scanning Items →](scanning-items.md)
