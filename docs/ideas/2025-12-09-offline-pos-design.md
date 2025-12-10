# Offline POS Design

**Date:** 2025-12-09
**Status:** Draft
**Context:** Disaster recovery point-of-sale for retail stores

## Overview

A disaster recovery point-of-sale application for capturing sales when primary systems are unavailable. Designed for simplicity, reliability, and minimal dependencies.

### Purpose

When primary POS systems go down (network outage, central system failure), stores need a way to continue ringing sales. Offline POS provides a minimal, reliable fallback that:

- Works 100% offline - no network required for core operation
- Syncs transactions automatically when connectivity returns
- Runs entirely on local hardware (commodity x86 mini-PCs)
- Uses a rigid, linear flow - scan → cart → pay → done

### Non-Goals

- Complex promotions or discounts
- Customer loyalty programs
- Advanced inventory management
- Multi-tender complexity (one payment type per transaction)
- Rich interactive UI (this is intentionally simple)

### Deployment Target

Runs on existing commodity x86 mini-PCs alongside self-checkout kiosk and associate POS applications. All processes run locally on the device.

## Architecture

### Two-Process Model

```
                                        ┌─────────────┐
                                        │   Central   │
                                        │   Systems   │
                                        └─────────────┘
                                               ▲
                                               │ Product sync down
                                               │ Transaction sync up
                                               │ Health check
┌──────────────────────────────────────────────┼──────────────────┐
│                    Offline POS Device        │                  │
│                                              │                  │
│  ┌───────────────────────────────────────────┴───────────┐     │
│  │                  Data Sync Daemon                      │     │
│  │                                                        │     │
│  │  - Owns SQLite DB         - REST API on :9200          │     │
│  │  - Syncs products/prices  - Exposes connectivity status│     │
│  │  - Uploads transactions   - Health checks central      │     │
│  └───────────────────────────────────────────────────────┘     │
│                              ▲                                  │
│                              │ REST (product lookup,            │
│                              │       transaction write,         │
│                              │       connectivity status)       │
│                              │                                  │
│                 ┌────────────┴───────────┐                     │
│                 │     POS Application    │                     │
│                 │                        │                     │
│                 │  - Node.js + Express   │                     │
│                 │  - Server-rendered HTML│                     │
│                 │  - htmx                │                     │
│                 │  - UI on :3000         │                     │
│                 └────────────┬───────────┘                     │
│                              │ WebSocket                        │
│                              ▼                                  │
│                 ┌────────────────────────┐                     │
│                 │ Unified Peripheral     │                     │
│                 │ Bridge :9100           │                     │
│                 └────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### Communication Paths

| From | To | Protocol | Purpose |
|------|----|----------|---------|
| Data Sync Daemon | Central Systems | HTTPS | Product/price sync down, transaction sync up, health check |
| POS App | Data Sync Daemon | REST (:9200) | Product lookups, transaction writes, connectivity status |
| POS App | Peripheral Bridge | WebSocket (:9100) | Scan events, payment collection, receipt printing |

### Data Sync Daemon

Always running, owns all persistent data:

- SQLite database (products, prices, operators, pending transactions)
- Exposes REST API on `localhost:9200`
- Detects connectivity via health checks to central systems
- Syncs product catalog down when online
- Pushes pending transactions up when online

### POS Application

Stateless UI layer:

- Node.js 24 serving HTML pages via Express
- Queries daemon for products, writes transactions to daemon
- Connects to peripheral bridge for scanning/payment/printing
- No direct communication with central systems

### Peripheral Bridge

As defined in `2025-12-07-peripheral-integration-design.md`:

- STOMP over WebSocket on port 9100
- Handles scanner, payment terminal, thermal printer
- Capability-based abstraction (device-agnostic)

## Data Model

### SQLite Schema

```sql
-- Products and prices (synced from central)
CREATE TABLE products (
  upc           TEXT PRIMARY KEY,
  sku           TEXT,
  name          TEXT NOT NULL,
  price_cents   INTEGER NOT NULL,
  department    TEXT,
  tax_rate      INTEGER,
  updated_at    TEXT
);

-- Authorized operators (synced from central)
CREATE TABLE operators (
  pin           TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  employee_id   TEXT,
  updated_at    TEXT
);

-- Pending transactions (local, uploaded when online)
CREATE TABLE transactions (
  id            TEXT PRIMARY KEY,
  operator_pin  TEXT NOT NULL,
  items_json    TEXT NOT NULL,
  subtotal      INTEGER NOT NULL,
  tax           INTEGER NOT NULL,
  total         INTEGER NOT NULL,
  payment_method TEXT,
  payment_ref   TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  status        TEXT DEFAULT 'pending',
  created_at    TEXT NOT NULL,
  synced_at     TEXT
);

-- Sync metadata
CREATE TABLE sync_status (
  key           TEXT PRIMARY KEY,
  value         TEXT
);
```

### Design Notes

- All prices stored in cents to avoid floating point issues
- Transactions stored as JSON blob for simplicity (no need to query line items locally)
- `tax_rate` stored as integer × 10000 (e.g., 8.25% = 82500)
- `sync_status` tracks: `last_product_sync`, `last_operator_sync`, `connectivity`
- Full product catalog (~50K SKUs) fits in ~20MB

## User Flow

### Screen Flow

```
[Login] → [Scan/Search] → [Cart] → [Payment] → [Complete]
              ↑              │
              └──────────────┘  (continue scanning)
```

### 1. Login Screen

- PIN entry (4-6 digits)
- Validated against local `operators` table
- Shows store number and "OFFLINE MODE" indicator
- If online: banner "Primary systems available - use main POS" (non-blocking)

### 2. Scan/Search Screen

- Large scan area - receives barcode events from peripheral bridge
- Search box for manual product lookup (name or UPC)
- Scanned item auto-adds to cart, shows brief confirmation
- "View Cart" button with item count badge

### 3. Cart Screen

- List of line items (name, qty, price)
- Quantity adjustment (+/-)
- Remove item
- Running subtotal, tax, total
- "Add More Items" returns to scan screen
- "Pay" proceeds to payment

### 4. Payment Screen

- Shows total amount
- Two buttons: "Card" / "Cash"
- **Card flow:**
  - Sends collect request to payment bridge
  - Shows "Insert/Tap Card" prompt
  - On success: proceed to complete
  - On offline: attempts store-and-forward (if under $2,000)
  - On decline/over-limit: shows error, return to cart
- **Cash flow:**
  - Assumes exact cash tendered (no change calculation in disaster mode)
- Optional: email/phone capture for deferred receipt delivery

### 5. Complete Screen

- "Transaction Complete" confirmation
- Transaction ID displayed
- Attempts thermal receipt print (best effort)
- "New Transaction" returns to scan screen (same operator)
- "Sign Out" returns to login

## Payment & Offline Auth

### Payment Flow

```
POS App                    Payment Bridge              Terminal
   │                            │                         │
   │  POST /app/payment/collect │                         │
   │  {amount: 4750,            │                         │
   │   offlineFloorLimit: 200000} ──────────────────────► │
   │                            │                         │
   │                            │    Attempt online auth  │
   │                            │ ◄─────────────────────► │
   │                            │                         │
   │  If online succeeds:       │                         │
   │ ◄── {status: "approved",   │                         │
   │      authCode: "ABC123"}   │                         │
   │                            │                         │
   │  If offline + under limit: │                         │
   │ ◄── {status: "approved",   │                         │
   │      authCode: "OFFLINE",  │                         │
   │      storeAndForward: true}│                         │
   │                            │                         │
   │  If offline + over limit:  │                         │
   │ ◄── {status: "declined",   │                         │
   │      reason: "floor_limit"}│                         │
```

### Offline Auth Behavior

- Payment bridge always attempts online authorization first
- If network unavailable/timeout: checks if amount ≤ floor limit ($2,000 default)
- **Under limit:** approves with `storeAndForward: true`, terminal stores encrypted auth request
- **Over limit:** hard decline, POS shows "Amount exceeds offline limit ($2,000)"
- Store-and-forward transactions uploaded by payment bridge when connectivity returns

### Cash Handling

- Simple "Cash" button assumes exact tender
- No change calculation (disaster mode simplification)
- Transaction records `payment_method: "cash"` with no `payment_ref`

## Sync & Connectivity

### Inbound Sync (Central → Device)

| Data | Frequency | Trigger |
|------|-----------|---------|
| Products/prices | Every 4 hours when online | Daemon startup, scheduled |
| Operators (PINs) | With product sync | Same as products |

- Full catalog refresh (~20MB)
- Stores `last_product_sync` timestamp in `sync_status`

### Outbound Sync (Device → Central)

- Pending transactions uploaded when connectivity detected
- Each transaction marked `status: 'synced'` with `synced_at` timestamp
- Failed uploads retry with exponential backoff
- Transactions remain locally for 30 days after sync (audit trail)

### Connectivity Detection

Daemon pings central health endpoint every 30 seconds.

**Status endpoint (`GET /status`):**

```json
{
  "online": false,
  "lastOnline": "2025-12-07T14:30:00Z",
  "pendingTransactions": 12,
  "lastProductSync": "2025-12-07T06:00:00Z"
}
```

### POS App Behavior

| Condition | UI Behavior |
|-----------|-------------|
| `online: true` | Banner: "Primary systems available. Consider using main POS." |
| `online: false` | No banner, normal operation |
| `pendingTransactions > 0 && online` | "Syncing X transactions..." → "X transactions synced ✓" |

## Receipts

### Output Strategy

1. **Attempt thermal print** - via peripheral bridge, best effort
2. **Always show screen confirmation** - transaction summary displayed
3. **Capture contact for deferred delivery** - optional email/phone stored with transaction

When transactions sync to central systems, order management can send digital receipts to customers who provided contact info.

## Error Handling

### Error Matrix

| Scenario | Behavior |
|----------|----------|
| Scanner disconnected | "Scan unavailable" indicator, enable manual UPC entry |
| Payment terminal offline | "Card unavailable" - cash only mode |
| Printer offline | Skip print silently, screen confirmation shown |
| Product not found | "Item not found" - prompt manual entry with manager PIN |
| PIN invalid | "Invalid PIN" - retry allowed, no lockout |
| Card declined | Show decline reason, return to cart, allow retry or cash |
| Over floor limit | "Amount exceeds offline limit ($2,000)" - reduce cart or use cash |
| Daemon unreachable | Fatal error: "System unavailable, contact support" |
| SQLite corruption | Daemon fails health check, requires restart/resync |

### Manual Price Entry

For items not in the local catalog:

- Requires manager PIN to unlock
- Enter UPC, description, price manually
- Flagged as `manual_entry: true` in transaction
- Flagged for review when synced to central

### Graceful Degradation Priority

1. **Always capture the sale** (core mission)
2. Accept card if possible, fall back to cash
3. Print if possible, always show screen
4. Sync when possible, never block on it

## Technology Stack

### Data Sync Daemon (Go)

- **Language:** Go (single binary, no runtime dependencies)
- **Database:** SQLite with WAL mode via `modernc.org/sqlite` (pure Go, no CGO)
- **HTTP:** Standard library `net/http`
- **Binary size:** ~10-15MB

### POS Application (Node.js)

- **Runtime:** Node.js 24
- **Framework:** Express.js
- **Templating:** EJS (server-rendered HTML)
- **Interactivity:** htmx (14KB, no build step)
- **Styling:** Pico CSS (~10KB classless framework)
- **WebSocket:** `ws` package for peripheral bridge

### No Build Tooling

- No Webpack, Vite, or bundlers
- No TypeScript compilation (plain JS)
- HTML templates served directly
- htmx loaded from local file (not CDN - offline requirement)

### Deployment Footprint

| Component | Size |
|-----------|------|
| Go binary (`offline-pos-sync`) | ~10-15MB |
| Node app folder | ~5MB |
| SQLite DB (full catalog) | ~20MB |
| **Total** | **~50MB** |

## Project Structure

```
apps/offline-pos/
├── sync-daemon/                  # Go application
│   ├── main.go
│   ├── db/
│   │   ├── sqlite.go             # Connection, migrations
│   │   └── queries.go            # Product, operator, transaction queries
│   ├── sync/
│   │   ├── products.go           # Product catalog sync
│   │   ├── operators.go          # Operator PIN sync
│   │   └── transactions.go       # Transaction upload
│   ├── api/
│   │   └── handlers.go           # REST handlers for POS app
│   └── go.mod
│
├── pos-app/                      # Node.js application
│   ├── server.js                 # Express entry point
│   ├── routes/
│   │   ├── login.js
│   │   ├── scan.js
│   │   ├── cart.js
│   │   ├── payment.js
│   │   └── complete.js
│   ├── views/                    # HTML templates
│   │   ├── layout.ejs
│   │   ├── login.ejs
│   │   ├── scan.ejs
│   │   ├── cart.ejs
│   │   ├── payment.ejs
│   │   └── complete.ejs
│   ├── public/
│   │   ├── htmx.min.js           # Local copy (offline)
│   │   ├── pico.min.css
│   │   └── app.css
│   ├── lib/
│   │   ├── daemon-client.js      # REST client for sync daemon
│   │   └── peripheral.js         # WebSocket client for bridge
│   └── package.json
│
└── README.md
```

### Monorepo Integration

- Lives under `apps/` alongside other applications
- Not part of Nx build graph (separate deployment target)
- Own Dockerfile for containerized deployment to device

## Testing Strategy

### Sync Daemon (Go)

- Unit tests for sync logic, query functions
- Integration tests with real SQLite (in-memory mode)
- Mock HTTP server for central system responses
- Run with `go test ./...`

### POS App (Node.js)

- Unit tests for route handlers with mocked daemon client
- Supertest for HTTP endpoint testing
- Mock peripheral bridge responses
- Run with `node --test` (built-in Node 24 test runner)

### End-to-End (Playwright)

- Mock daemon API (Express server with canned responses)
- Mock peripheral bridge (WebSocket server with scripted events)
- Device emulators from peripheral integration design

**Test scenarios:**

- Happy path: login → scan → cart → card payment → complete
- Offline card decline (over floor limit)
- Scanner unavailable fallback to manual entry
- Cash payment flow
- Receipt capture (email/phone)

### Manual Testing

- Local dev setup with mock daemon and device emulators
- Simulated offline mode (daemon returns `online: false`)
- Device emulators for scanner, payment terminal, printer

## Related Documents

- [Peripheral Integration Design](2025-12-07-peripheral-integration-design.md) - Device abstraction layer used by this application
