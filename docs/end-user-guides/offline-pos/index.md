# Offline POS User Guide

Welcome to the Offline POS User Guide. This documentation covers the disaster recovery point-of-sale system designed for use when primary store systems are unavailable.

---

## What is the Offline POS?

The Offline POS is a backup point-of-sale system that allows store associates to continue processing transactions when the main POS system or network connectivity is unavailable. It runs on a local device and stores transactions until they can be synchronized with central systems.

![Offline POS Overview](images/offline-pos-overview-wireframe.png)
*The Offline POS main interface*

---

## When to Use Offline POS

Use the Offline POS when:

| Scenario | Description |
|----------|-------------|
| **Network Outage** | Store internet or network is down |
| **Main POS Failure** | Primary POS system is unavailable |
| **Planned Maintenance** | Central systems are undergoing maintenance |
| **Disaster Recovery** | Emergency situations requiring backup systems |

**Important:** Only use Offline POS when instructed by management. All transactions must be reconciled once primary systems return.

---

## Key Differences from Main POS

The Offline POS has a simplified feature set for emergency use:

| Feature | Main POS | Offline POS |
|---------|----------|-------------|
| Customer Lookup | Yes | No |
| Loyalty Programs | Yes | No |
| Complex Discounts | Yes | No |
| Returns | Yes | No |
| Multiple Fulfillment | Yes | No |
| Payment Methods | All | Card & Cash |
| Receipt Options | Multiple | Print Only |

---

## Transaction Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  LOGIN   │───▶│   SCAN   │───▶│   CART   │───▶│ PAYMENT  │───▶│ COMPLETE │
│          │    │          │    │  REVIEW  │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │               │
  Enter PIN       Barcode         +/- Qty         Card or        Receipt
                 or Search        Remove           Cash          Printed
```

---

## Guide Contents

### Getting Started
| Section | Description |
|---------|-------------|
| [Getting Started](getting-started.md) | Login, navigation, and status indicators |

### Transactions
| Section | Description |
|---------|-------------|
| [Scanning Items](scanning-items.md) | Barcode scanning and product search |
| [Cart Management](cart-management.md) | Adjusting quantities and removing items |
| [Payment](payment.md) | Processing card and cash payments |

### Reference
| Section | Description |
|---------|-------------|
| [Troubleshooting](troubleshooting.md) | Common issues and solutions |

---

## Connectivity Status

The Offline POS displays connectivity status in the header:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFLINE POS                    │  Operator: 1234  │  [🔴 Offline]  [🚪]│
└─────────────────────────────────────────────────────────────────────────┘
```

| Status | Indicator | Meaning |
|--------|-----------|---------|
| **Online** | 🟢 Green | Connected to central systems |
| **Offline** | 🔴 Red | Operating in offline mode |
| **Syncing** | 🟡 Yellow | Uploading pending transactions |

When offline, transactions are stored locally and will automatically sync when connectivity returns.

---

## Understanding Transaction Sync

### How It Works

1. **While offline**: Transactions are saved to the local database
2. **When online**: System automatically uploads pending transactions
3. **Confirmation**: Each transaction receives a central ID after sync

### Pending Transactions

The status indicator shows the number of pending (unsynced) transactions:

```
[🔴 Offline - 5 pending]
```

**Important:** Do not close the application until all transactions are synced. Check with your manager before shutting down if pending transactions exist.

---

## Screen Layout

The Offline POS uses a simple, mobile-friendly layout:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                  │
│  [Status Indicator]           [Operator ID]           [Sign Out]        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                                                                          │
│                          MAIN CONTENT AREA                               │
│                                                                          │
│                    (Changes based on current step)                       │
│                                                                          │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                          ACTION BUTTONS                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Getting Help

### During a Transaction

- **Technical issues**: Contact IT Help Desk
- **Process questions**: Contact store manager
- **Payment issues**: Follow cash handling procedures

### Emergency Contacts

Keep these numbers accessible when using Offline POS:

- **IT Help Desk**: ext. 4357 (HELP)
- **Store Manager**: [See posted schedule]
- **District Manager**: [Posted in break room]

---

## Before You Start Checklist

Before using Offline POS:

- [ ] Confirmed main POS is unavailable
- [ ] Received manager authorization
- [ ] Know your operator PIN
- [ ] Receipt printer has paper
- [ ] Card terminal is connected (if available)
- [ ] Know emergency contact numbers

---

## Next Steps

Ready to begin? Start with:

- [Getting Started](getting-started.md) - Learn how to log in and navigate

---

*Last updated: December 2024*
