# Merchant Portal User Guide

The Merchant Portal is a web-based application for managing product catalog, pricing, and inventory across your retail operations. This guide covers all features available to merchants, pricing specialists, and inventory managers.

## User Roles

| Role | Description | Primary Capabilities |
|------|-------------|---------------------|
| Merchant Admin | Full access to all portal features | Product CRUD, pricing, inventory, user management |
| Pricing Specialist | Manages product pricing | View products, update prices, set promotions |
| Inventory Specialist | Manages stock levels | View products, update inventory, low-stock alerts |
| Viewer | Read-only access | View products, prices, and inventory levels |

## Portal Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  MERCHANT PORTAL                              [User Menu ▼] [Logout]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Dashboard│ │ Products │ │ Pricing  │ │Inventory │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │                    [Content Area]                           │   │
│  │                                                             │   │
│  │  - Dashboard: Key metrics and alerts                        │   │
│  │  - Products: Catalog management                             │   │
│  │  - Pricing: Price updates and promotions                    │   │
│  │  - Inventory: Stock levels and reorder alerts               │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Getting Started

### Logging In

1. Navigate to the Merchant Portal URL provided by your administrator
2. Enter your email address and password
3. Click **Sign In**
4. Upon successful login, you'll be directed to the Dashboard

```
┌─────────────────────────────────────────┐
│         MERCHANT PORTAL                 │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Email                             │  │
│  │ ┌───────────────────────────────┐ │  │
│  │ │ user@example.com              │ │  │
│  │ └───────────────────────────────┘ │  │
│  │                                   │  │
│  │ Password                          │  │
│  │ ┌───────────────────────────────┐ │  │
│  │ │ ••••••••••                    │ │  │
│  │ └───────────────────────────────┘ │  │
│  │                                   │  │
│  │ ┌───────────────────────────────┐ │  │
│  │ │         Sign In               │ │  │
│  │ └───────────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Navigation

The main navigation bar provides access to all portal sections:

| Section | Description | Access Level |
|---------|-------------|--------------|
| Dashboard | Overview metrics, alerts, recent activity | All roles |
| Products | Product catalog management | Admin, view for others |
| Pricing | Price management and promotions | Admin, Pricing Specialist |
| Inventory | Stock levels and alerts | Admin, Inventory Specialist |

---

## Dashboard

The Dashboard provides an at-a-glance view of your retail operations.

### Key Metrics

```
┌─────────────────────────────────────────────────────────────────────┐
│  DASHBOARD                                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ Total SKUs   │ │ Low Stock    │ │ Price        │ │ Active     │ │
│  │              │ │ Alerts       │ │ Changes (7d) │ │ Promotions │ │
│  │    1,247     │ │     23       │ │     156      │ │     8      │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │
│                                                                     │
│  Recent Activity                        Low Stock Items             │
│  ┌─────────────────────────────┐       ┌─────────────────────────┐ │
│  │ SKU-1001 price updated      │       │ SKU-0042 - 3 units      │ │
│  │ SKU-2045 inventory adjusted │       │ SKU-0089 - 5 units      │ │
│  │ New product SKU-3001 added  │       │ SKU-0156 - 8 units      │ │
│  └─────────────────────────────┘       └─────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Dashboard Widgets

| Widget | Description |
|--------|-------------|
| Total SKUs | Count of all products in catalog |
| Low Stock Alerts | Products below reorder threshold |
| Price Changes (7d) | Number of price updates in past week |
| Active Promotions | Currently running promotional prices |
| Recent Activity | Timeline of recent catalog changes |
| Low Stock Items | Quick view of items needing reorder |

---

## Product Management

### Viewing Products

The Products section displays your complete product catalog.

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRODUCTS                                      [+ Add Product]      │
├─────────────────────────────────────────────────────────────────────┤
│  Search: [________________] Category: [All Categories ▼] [Search]   │
├─────────────────────────────────────────────────────────────────────┤
│  SKU        │ Name              │ Category    │ MSRP    │ Actions   │
│─────────────┼───────────────────┼─────────────┼─────────┼───────────│
│  SKU-0001   │ Widget Pro        │ Electronics │ $49.99  │ [✏] [🗑]  │
│  SKU-0002   │ Gadget Plus       │ Electronics │ $29.99  │ [✏] [🗑]  │
│  SKU-0003   │ Basic Tool Set    │ Tools       │ $19.99  │ [✏] [🗑]  │
│  SKU-0004   │ Premium Connector │ Accessories │ $9.99   │ [✏] [🗑]  │
├─────────────────────────────────────────────────────────────────────┤
│  Showing 1-4 of 1,247 products              [< Prev] [1] [2] [Next >]│
└─────────────────────────────────────────────────────────────────────┘
```

### Adding a New Product

1. Click **+ Add Product** button
2. Fill in the required fields:

| Field | Required | Description |
|-------|----------|-------------|
| SKU | Yes | Unique product identifier |
| Name | Yes | Product display name |
| Description | No | Detailed product description |
| Category | Yes | Product category for organization |
| Image URL | No | Product image location |
| Suggested Retail Price | Yes | Manufacturer's suggested price |
| Currency | No | Defaults to USD |

3. Click **Save** to create the product

### Editing a Product

1. Click the **Edit** (✏) icon next to the product
2. Modify the desired fields
3. Click **Save** to update

### Deleting a Product

1. Click the **Delete** (🗑) icon next to the product
2. Confirm the deletion in the dialog
3. Product will be removed from catalog

> **Warning**: Deleting a product is permanent and cannot be undone.

---

## Pricing Management

### Viewing Prices

The Pricing section shows current prices for all products.

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRICING                                                            │
├─────────────────────────────────────────────────────────────────────┤
│  Search: [________________] Filter: [All Prices ▼] [Search]         │
├─────────────────────────────────────────────────────────────────────┤
│  SKU        │ Product Name      │ Current   │ Original │ Currency  │
│─────────────┼───────────────────┼───────────┼──────────┼───────────│
│  SKU-0001   │ Widget Pro        │ $39.99    │ $49.99   │ USD       │
│  SKU-0002   │ Gadget Plus       │ $29.99    │ $29.99   │ USD       │
│  SKU-0003   │ Basic Tool Set    │ $15.99    │ $19.99   │ USD       │
│  SKU-0004   │ Premium Connector │ $9.99     │ $9.99    │ USD       │
├─────────────────────────────────────────────────────────────────────┤
│  [< Prev] [1] [2] [3] [Next >]                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Updating a Price

1. Click on the product row or the edit icon
2. Enter the new price information:

| Field | Description |
|-------|-------------|
| Current Price | Active selling price |
| Original Price | Strike-through price (for promotions) |
| Currency | Price currency (USD, EUR, etc.) |

3. Click **Save** to update the price

### Price Display Logic

| Condition | Display |
|-----------|---------|
| Current = Original | Single price shown |
| Current < Original | Sale price with strikethrough original |
| Current > Original | New price (price increase) |

---

## Inventory Management

### Viewing Inventory

The Inventory section shows stock levels for all products.

```
┌─────────────────────────────────────────────────────────────────────┐
│  INVENTORY                                                          │
├─────────────────────────────────────────────────────────────────────┤
│  Search: [________________] Filter: [Low Stock ▼] [Search]          │
├─────────────────────────────────────────────────────────────────────┤
│  SKU        │ Product Name      │ Available │ Status   │ Actions   │
│─────────────┼───────────────────┼───────────┼──────────┼───────────│
│  SKU-0042   │ Deluxe Widget     │ 3         │ ⚠ LOW    │ [Update]  │
│  SKU-0089   │ Standard Gadget   │ 5         │ ⚠ LOW    │ [Update]  │
│  SKU-0156   │ Mini Connector    │ 8         │ ⚠ LOW    │ [Update]  │
│  SKU-0001   │ Widget Pro        │ 150       │ ✓ OK     │ [Update]  │
├─────────────────────────────────────────────────────────────────────┤
│  Low Stock Threshold: 10 units                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Inventory Status Indicators

| Status | Icon | Description |
|--------|------|-------------|
| OK | ✓ | Stock level above threshold |
| Low | ⚠ | Stock below threshold, reorder recommended |
| Out | ✖ | Zero stock, immediate action required |

### Updating Inventory

1. Click **Update** next to the product
2. Enter the new available quantity
3. Click **Save** to update stock level

### Low Stock Alerts

Products with inventory below the configured threshold appear:
- On the Dashboard in the Low Stock Items widget
- At the top of the Inventory list when filtered
- With a warning indicator (⚠) in all views

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open search |
| `G` then `D` | Go to Dashboard |
| `G` then `P` | Go to Products |
| `G` then `R` | Go to Pricing |
| `G` then `I` | Go to Inventory |
| `Esc` | Close modal/dialog |

---

## Troubleshooting

### Login Issues

| Problem | Solution |
|---------|----------|
| "Invalid credentials" error | Verify email and password are correct |
| Account locked | Contact administrator to unlock |
| Session expired | Log in again; sessions expire after inactivity |

### Data Not Loading

| Problem | Solution |
|---------|----------|
| Spinner shows indefinitely | Refresh the page; check internet connection |
| "Error loading data" message | Backend service may be down; try again in a few minutes |
| Stale data displayed | Click refresh or navigate away and back |

### Changes Not Saving

| Problem | Solution |
|---------|----------|
| "Save failed" error | Check all required fields are filled |
| Validation errors | Review highlighted fields for issues |
| Network timeout | Check connection; retry the save |

### Browser Compatibility

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Chrome | 90+ | Fully Supported |
| Firefox | 88+ | Fully Supported |
| Safari | 14+ | Fully Supported |
| Edge | 90+ | Fully Supported |

---

## Getting Help

For additional assistance:

1. **Technical Issues**: Contact IT Support
2. **Access Requests**: Submit through your manager
3. **Feature Requests**: Use the feedback form in the portal

---

*Last updated: December 2024*
