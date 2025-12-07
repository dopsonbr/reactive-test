# Getting Started

Learn how to log in, navigate the POS system, and understand your dashboard.

---

## Logging In

### Step 1: Open the POS Application

Navigate to the POS system URL provided by your IT department. The login screen appears:

![Login Screen](images/login-screen-wireframe.png)
*The POS login screen*

### Step 2: Enter Credentials

1. **Employee ID**: Enter your employee ID number
2. **Password**: Enter your password
3. **Store/Location**: Select your store (if applicable)
4. Click **"Sign In"** or press **Enter**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    POINT OF SALE                            │
│                                                             │
│            ┌─────────────────────────────────┐             │
│            │  Employee ID                    │             │
│            │  ┌───────────────────────────┐  │             │
│            │  │ 123456                    │  │             │
│            │  └───────────────────────────┘  │             │
│            │                                 │             │
│            │  Password                       │             │
│            │  ┌───────────────────────────┐  │             │
│            │  │ ••••••••                  │  │             │
│            │  └───────────────────────────┘  │             │
│            │                                 │             │
│            │  Store Location                 │             │
│            │  ┌───────────────────────────┐  │             │
│            │  │ Store #1234 - Main St   ▼ │  │             │
│            │  └───────────────────────────┘  │             │
│            │                                 │             │
│            │  ┌───────────────────────────┐  │             │
│            │  │        Sign In            │  │             │
│            │  └───────────────────────────┘  │             │
│            └─────────────────────────────────┘             │
│                                                             │
│            Forgot password? Contact your manager            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Register Assignment

After login, you may be prompted to select or confirm your register:

![Register Selection](images/register-select-wireframe.png)
*Select your assigned register*

| Option | Description |
|--------|-------------|
| **Assigned Register** | Your default register (auto-selected) |
| **Available Registers** | Other open registers you can use |
| **Floating** | No specific register (contact center, managers) |

---

## Navigation Overview

### Header Bar

The header bar appears at the top of every screen:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🏪 Store #1234      │ John Doe (Associate) │ Reg: 01 │ [🔍] [⚙️] [🚪]  │
└─────────────────────────────────────────────────────────────────────────┘
```

| Element | Description |
|---------|-------------|
| **Store Info** | Current store name and number |
| **User Info** | Your name and role |
| **Register** | Assigned register number |
| **Search** 🔍 | Global search (Cmd+K) |
| **Settings** ⚙️ | User preferences |
| **Logout** 🚪 | Sign out of system |

### Sidebar Navigation

The sidebar provides access to main sections:

![Sidebar Navigation](images/sidebar-wireframe.png)
*Main navigation sidebar*

| Icon | Section | Description |
|------|---------|-------------|
| 🏠 | **Home** | Dashboard with metrics and quick actions |
| 🛒 | **Transaction** | Start or continue a transaction |
| 👥 | **Customers** | Customer search and management |
| 📦 | **Orders** | Order lookup and management |
| 📊 | **Reports** | Sales reports (managers only) |
| ⚙️ | **Settings** | User preferences and configuration |

### Collapsing the Sidebar

- Click the **hamburger icon** (☰) to collapse/expand
- Collapsed mode shows icons only, providing more workspace
- Your preference is remembered between sessions

---

## Dashboard (Home Screen)

The dashboard is your landing page after login, providing a summary of activity and quick access to common tasks.

![Dashboard](images/dashboard-wireframe.png)
*The POS dashboard*

### Dashboard Sections

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DASHBOARD                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  TODAY'S SALES   │  │  TRANSACTIONS    │  │  ITEMS SOLD      │      │
│  │    $12,450.00    │  │       47         │  │      156         │      │
│  │   ▲ 12% vs avg   │  │   ▲ 8% vs avg    │  │   ▲ 15% vs avg   │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                          │
│  QUICK ACTIONS                                                           │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐              │
│  │ 🛒 New         │ │ 👤 Find        │ │ 📦 Order       │              │
│  │ Transaction    │ │ Customer       │ │ Lookup         │              │
│  └────────────────┘ └────────────────┘ └────────────────┘              │
│                                                                          │
│  RECENT TRANSACTIONS                                                     │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ #12345  │  10:45 AM  │  John S.  │  $125.99  │  Completed    │      │
│  │ #12344  │  10:32 AM  │  Guest    │   $45.00  │  Completed    │      │
│  │ #12343  │  10:15 AM  │  Mary J.  │  $289.50  │  Completed    │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  PENDING ACTIONS (Manager only)                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ 🔔 2 markdown approvals pending                               │      │
│  │ 🔔 1 void request awaiting authorization                      │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Metrics Cards

The top row shows key performance indicators:

| Metric | Description | Comparison |
|--------|-------------|------------|
| **Today's Sales** | Total revenue today | vs. daily average |
| **Transactions** | Number of completed transactions | vs. daily average |
| **Items Sold** | Total items across all transactions | vs. daily average |

*Managers see additional metrics like returns, voids, and average transaction value.*

### Quick Actions

One-click access to common tasks:

| Action | Keyboard | Description |
|--------|----------|-------------|
| **New Transaction** | F2 | Start a new sale |
| **Find Customer** | F3 | Open customer search |
| **Order Lookup** | F4 | Find existing order |
| **Suspend/Resume** | F5 | Manage suspended transactions |

### Recent Transactions

Shows your last 5-10 transactions for quick reference:
- Click any transaction to view details
- Useful for reprinting receipts or handling immediate returns

### Pending Actions (Managers)

Managers see notifications for items requiring their attention:
- Markdown approval requests
- Void authorization requests
- Suspended transactions

---

## User Preferences

Access your preferences via the **Settings** icon (⚙️) in the header or sidebar.

![User Settings](images/settings-wireframe.png)
*User preferences panel*

### Display Settings

| Setting | Options | Description |
|---------|---------|-------------|
| **Theme** | Light / Dark / System | Interface color scheme |
| **Compact Mode** | On / Off | Denser information display |
| **Large Text** | On / Off | Increased font size |
| **Sound Effects** | On / Off | Audio feedback for scans, alerts |

### Transaction Defaults

| Setting | Options | Description |
|---------|---------|-------------|
| **Default Fulfillment** | Immediate / Pickup / Delivery | Pre-selected fulfillment type |
| **Auto-print Receipt** | On / Off | Print receipt automatically |
| **Receipt Format** | Full / Compact | Receipt detail level |

### Keyboard Layout

| Setting | Options | Description |
|---------|---------|-------------|
| **Shortcut Style** | Standard / Legacy | Keyboard shortcut mapping |
| **Numpad Entry** | On / Off | Use numpad for quantity entry |

---

## Session Management

### Session Timeout

For security, the system will lock after inactivity:

- **Warning**: After 5 minutes of inactivity
- **Lock**: After 10 minutes of inactivity
- **Logout**: After 30 minutes of lock

When locked, enter your password to resume:

```
┌─────────────────────────────────────────┐
│                                         │
│        Session Locked                   │
│                                         │
│        Welcome back, John               │
│                                         │
│        Enter password to continue:      │
│        ┌───────────────────────────┐   │
│        │ ••••••••                  │   │
│        └───────────────────────────┘   │
│                                         │
│        [Unlock]  [Switch User]          │
│                                         │
└─────────────────────────────────────────┘
```

### Switching Users

Multiple associates can use the same workstation:

1. Click **Switch User** from lock screen, or
2. Click your name in header → **Switch User**
3. New user logs in with their credentials
4. Previous user's suspended transactions remain available

### Logging Out

To properly log out:

1. Complete or suspend any active transaction
2. Click the **Logout** icon (🚪) in the header
3. Confirm logout when prompted

**Important**: Always log out when leaving your workstation unattended.

---

## Getting Help

### Context-Sensitive Help

Press **F1** or click **Help** to get help for your current screen:

- Transaction screen → Transaction help
- Customer search → Customer lookup help
- Payment screen → Payment processing help

### Command Palette

Press **Cmd+K** (Mac) or **Ctrl+K** (Windows) to open the command palette:

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Search commands, customers, products...                  │
├─────────────────────────────────────────────────────────────┤
│  RECENT                                                      │
│  → New Transaction                                           │
│  → Find Customer                                             │
│                                                              │
│  COMMANDS                                                    │
│  → New Transaction               F2                          │
│  → Find Customer                 F3                          │
│  → Order Lookup                  F4                          │
│  → Apply Markdown                F6                          │
│  → Process Payment               F8                          │
│  → Print Receipt                 Ctrl+P                      │
│                                                              │
│  Type to search for products, customers, or orders...        │
└─────────────────────────────────────────────────────────────┘
```

### Reporting Issues

If you encounter a technical issue:

1. Note the **error message** and **error code** if displayed
2. Note what you were doing when it occurred
3. Contact your **supervisor** or **IT Help Desk**
4. Provide the transaction number if applicable

---

## First Day Checklist

Before starting your first shift:

- [ ] Received login credentials from manager
- [ ] Completed system training
- [ ] Know your assigned register
- [ ] Tested barcode scanner
- [ ] Know location of receipt paper
- [ ] Know how to contact supervisor for help

---

## Next Steps

Now that you're logged in:

- [Start a Transaction](transaction-basics.md)
- [Learn Keyboard Shortcuts](keyboard-shortcuts.md)
- [Understand Fulfillment Options](fulfillment-options.md)

---

[Back to Index](index.md) | [Next: Transaction Basics →](transaction-basics.md)
