# Point of Sale (POS) System User Guide

Welcome to the Point of Sale System User Guide. This comprehensive documentation covers all features available to store associates, managers, contact center agents, and B2B sales representatives.

---

## What is the POS System?

The POS (Point of Sale) System is a web-based application designed for retail professionals to process transactions, manage customers, and handle complex order scenarios. Whether you're ringing up a quick in-store purchase or configuring a multi-delivery B2B order, this system provides the tools you need.

![POS System Overview](images/pos-overview-wireframe.png)
*The POS System main interface*

---

## User Roles

The POS System adapts its features based on your role:

| Role | Primary Use | Key Capabilities |
|------|-------------|------------------|
| **Store Associate** | In-store transactions | Scan items, process payments, basic markdowns |
| **Store Manager** | Store operations | All associate functions + approvals, all markdown types |
| **Contact Center Agent** | Remote phone/chat orders | Customer lookup, remote payments, delivery scheduling |
| **B2B Sales Representative** | Business customer sales | Complex quotes, multi-delivery, net terms |

Your role determines which features and menu options are available to you.

---

## Quick Start by Role

### Store Associate
1. [Log in](getting-started.md) to the system
2. [Start a transaction](transaction-basics.md)
3. [Scan or enter items](transaction-basics.md#adding-items)
4. [Process payment](payment-processing.md)

### Store Manager
- All associate functions, plus:
- [Approve markdowns](markdowns-discounts.md#manager-approval)
- [Void transactions](order-management.md#voiding-orders)
- [View reports](getting-started.md#dashboard)

### Contact Center Agent
1. [Look up customer](customer-lookup.md)
2. [Enter items manually](transaction-basics.md#manual-entry)
3. [Schedule delivery](fulfillment-options.md#delivery)
4. [Capture remote payment](payment-processing.md#card-not-present)

### B2B Sales Representative
1. [Find business customer](customer-lookup.md#b2b-customers)
2. [Configure multi-fulfillment](fulfillment-options.md#multi-fulfillment)
3. [Apply B2B pricing](b2b-transactions.md)
4. [Set up net terms](payment-processing.md#net-terms)

---

## Guide Contents

### Getting Started
| Section | Description |
|---------|-------------|
| [Getting Started](getting-started.md) | Login, navigation, dashboard overview |
| [Keyboard Shortcuts](keyboard-shortcuts.md) | Efficiency shortcuts for power users |

### Transactions
| Section | Description |
|---------|-------------|
| [Transaction Basics](transaction-basics.md) | Starting transactions, scanning, cart management |
| [Customer Lookup](customer-lookup.md) | Finding and linking customers to transactions |
| [Fulfillment Options](fulfillment-options.md) | Immediate, pickup, delivery, will-call, installation |
| [Payment Processing](payment-processing.md) | All payment methods and scenarios |
| [Markdowns & Discounts](markdowns-discounts.md) | Applying discounts, authority levels |

### Customer & Order Management
| Section | Description |
|---------|-------------|
| [Customer Management](customer-management.md) | Creating customers, editing profiles, loyalty |
| [Order Management](order-management.md) | Viewing orders, modifications, returns |

### Specialized Features
| Section | Description |
|---------|-------------|
| [B2B Transactions](b2b-transactions.md) | Business customers, hierarchy, net terms |
| [Contact Center Operations](contact-center.md) | Phone orders, remote payments |

### Reference
| Section | Description |
|---------|-------------|
| [Troubleshooting](troubleshooting.md) | Common issues and solutions |

---

## Transaction Complexity

The POS System handles transactions across the full complexity spectrum:

```
SIMPLE ◄──────────────────────────────────────────────────────► COMPLEX

┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────┐
│ Quick Sale  │  │ Standard    │  │ Phone Order     │  │ B2B Multi-       │
│             │  │ In-Store    │  │                 │  │ Delivery         │
├─────────────┤  ├─────────────┤  ├─────────────────┤  ├──────────────────┤
│ • Scan      │  │ • Scan      │  │ • Customer      │  │ • B2B Customer   │
│ • Pay       │  │ • Customer  │  │   lookup        │  │ • Multi ship-to  │
│ • Done      │  │ • Checkout  │  │ • Manual entry  │  │ • Split fulfill  │
│             │  │             │  │ • Delivery      │  │ • Scheduled      │
│             │  │             │  │ • Remote pay    │  │ • Net terms      │
└─────────────┘  └─────────────┘  └─────────────────┘  └──────────────────┘
     1-2 min          3-5 min          5-10 min            15-30 min
```

---

## Screen Layout Overview

The POS interface is organized into functional areas:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                              │
│  [Store Info] [User: John D.] [Role: Associate] [Register: 01] [Logout] │
├─────────┬───────────────────────────────────────────────────────────────┤
│         │                                                               │
│  SIDE   │                    MAIN WORK AREA                             │
│  BAR    │                                                               │
│         │  ┌─────────────────────────┐  ┌─────────────────────────┐    │
│ [Home]  │  │                         │  │                         │    │
│ [Trans] │  │    ITEM ENTRY /         │  │    CART / ORDER         │    │
│ [Cust]  │  │    SEARCH AREA          │  │    SUMMARY              │    │
│ [Orders]│  │                         │  │                         │    │
│ [Rpts]  │  │                         │  │                         │    │
│         │  └─────────────────────────┘  └─────────────────────────┘    │
│         │                                                               │
│         │  ┌───────────────────────────────────────────────────────┐   │
│         │  │              ACTION BAR / PAYMENT OPTIONS              │   │
│         │  └───────────────────────────────────────────────────────┘   │
│         │                                                               │
└─────────┴───────────────────────────────────────────────────────────────┘
```

---

## Key Features

### For Speed
- **Barcode scanning** for instant item lookup
- **Keyboard shortcuts** for common actions
- **Command palette** (Cmd+K / Ctrl+K) for quick navigation
- **Customer autocomplete** for fast lookup

### For Flexibility
- **Multiple fulfillment types** in single order
- **Split payments** across payment methods
- **Remote payment capture** for phone orders
- **Multi-delivery scheduling** for B2B

### For Control
- **Role-based permissions** for security
- **Manager override workflow** for exceptions
- **Audit logging** for compliance
- **Transaction limits** by role

---

## Getting Help

### In the Application
- Press **F1** or click **Help** for context-sensitive help
- Use **Cmd+K** (Mac) or **Ctrl+K** (Windows) to search for features
- Hover over any field for tooltip guidance

### From Your Team
- **Supervisors** can answer process questions
- **Managers** can authorize exceptions
- **IT Help Desk** for technical issues

### Additional Resources
- [Keyboard Shortcuts](keyboard-shortcuts.md) - Complete shortcut reference
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

---

## System Requirements

The POS System runs in a web browser and requires:

- **Browser**: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- **Screen**: Minimum 1280x720 resolution (1920x1080 recommended)
- **Network**: Stable internet connection
- **Peripherals**: Barcode scanner (USB HID), receipt printer, card terminal

---

*Last updated: December 2024*
