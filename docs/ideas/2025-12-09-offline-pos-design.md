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
- Single-page application complexity (localhost makes MPA instant)

### Deployment Target

Runs on existing commodity x86 mini-PCs alongside self-checkout kiosk and associate POS applications. All processes run locally on the device.

## Architecture

### Single Binary Model

The entire application runs as a single Go binary. Localhost serving eliminates network latency, making traditional multi-page navigation instantaneous. No need for SPA complexity.

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
│  │                 Offline POS Binary (Go)                │     │
│  │                                                        │     │
│  │  HTTP Server (:3000)                                   │     │
│  │  ├── HTML pages (Go templates)                         │     │
│  │  ├── REST API (/api/*)                                 │     │
│  │  └── Static assets (embed.FS)                          │     │
│  │      ├── /static/js/*.js (ESM modules)                 │     │
│  │      └── /static/css/styles.css                        │     │
│  │                                                        │     │
│  │  SQLite Database                                       │     │
│  │  ├── products, operators                               │     │
│  │  └── pending transactions                              │     │
│  │                                                        │     │
│  │  Background Sync                                       │     │
│  │  ├── Product catalog refresh                           │     │
│  │  └── Transaction upload                                │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│                 Browser (localhost:3000)                         │
│                 ┌────────────────────────┐                      │
│                 │  HTML + Vanilla JS     │                      │
│                 │  └── WebSocket to ─────┼──────────┐           │
│                 │      peripheral bridge │          │           │
│                 └────────────────────────┘          │           │
│                                                     ▼           │
│                              ┌────────────────────────┐         │
│                              │ Unified Peripheral     │         │
│                              │ Bridge :9100           │         │
│                              └────────────────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

### Communication Paths

| From | To | Protocol | Purpose |
|------|----|----------|---------|
| Go Binary | Central Systems | HTTPS | Product/price sync down, transaction sync up |
| Browser | Go Binary | HTTP (:3000) | Page loads, form submissions, API calls |
| Browser JS | Peripheral Bridge | WebSocket (:9100) | Scan events, payment, printing |

### Why Single Binary?

| Aspect | Single Go Binary | Two-Process (Go + Node) |
|--------|------------------|-------------------------|
| Runtimes | 1 | 2 |
| Deployment | Copy one file | Manage two processes |
| Memory | ~30MB | ~100MB+ |
| Failure modes | Fewer | Process coordination |
| Localhost latency | ~0ms | ~0ms |

For a disaster recovery app, fewer moving parts means higher reliability.

### Peripheral Bridge

As defined in `2025-12-07-peripheral-integration-design.md`:

- STOMP over WebSocket on port 9100
- Handles scanner, payment terminal, thermal printer
- Capability-based abstraction (device-agnostic)
- Browser JavaScript connects directly to the bridge

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

### Screen Flow (Multi-Page)

```
[Login] → [Scan/Search] → [Cart] → [Payment] → [Complete]
              ↑              │
              └──────────────┘  (continue scanning)
```

Each transition is a full page load. On localhost, this is instantaneous (~1-2ms).

### 1. Login Screen (`GET /`)

- PIN entry form (4-6 digits)
- Form POST to `/login`, validated against `operators` table
- On success: redirect to `/scan`
- Shows store number and "OFFLINE MODE" indicator
- If online: banner "Primary systems available - use main POS"

### 2. Scan/Search Screen (`GET /scan`)

- Large scan target area
- JavaScript listens for barcode events via WebSocket to peripheral bridge
- On scan: `POST /api/cart/add` with UPC, then refresh page or update DOM
- Search form for manual product lookup
- "View Cart" button with item count

### 3. Cart Screen (`GET /cart`)

- List of line items rendered server-side
- Quantity +/- buttons POST to `/api/cart/update`
- Remove button POSTs to `/api/cart/remove`
- Running subtotal, tax, total
- "Add More Items" links to `/scan`
- "Pay" links to `/payment`

### 4. Payment Screen (`GET /payment`)

- Shows total amount
- Two buttons: "Card" / "Cash"
- **Card flow:**
  - JavaScript sends collect request to payment bridge via WebSocket
  - Shows "Insert/Tap Card" status updates
  - On success: POST to `/api/transaction/complete`, redirect to `/complete`
  - On decline/over-limit: show error message
- **Cash flow:**
  - POST to `/api/transaction/complete` with `method=cash`
  - Redirect to `/complete`
- Optional: email/phone input for deferred receipt

### 5. Complete Screen (`GET /complete`)

- "Transaction Complete" confirmation
- Transaction ID displayed
- JavaScript triggers receipt print via peripheral bridge
- "New Transaction" links to `/scan` (same operator session)
- "Sign Out" clears session, redirects to `/`

## Payment & Offline Auth

### Payment Flow

```
Browser JS                 Payment Bridge              Terminal
   │                            │                         │
   │  SEND /app/payment/collect │                         │
   │  {amount: 4750,            │                         │
   │   offlineFloorLimit: 200000} ──────────────────────► │
   │                            │                         │
   │                            │    Attempt online auth  │
   │                            │ ◄─────────────────────► │
   │                            │                         │
   │  MESSAGE: approved         │                         │
   │ ◄── {authCode: "ABC123"}   │                         │
   │                            │                         │
   │  MESSAGE: approved         │                         │
   │ ◄── {authCode: "OFFLINE",  │  (store-and-forward)    │
   │      storeAndForward: true}│                         │
   │                            │                         │
   │  MESSAGE: declined         │                         │
   │ ◄── {reason: "floor_limit"}│  (over $2,000 offline)  │
```

### Offline Auth Behavior

- Payment bridge always attempts online authorization first
- If network unavailable/timeout: checks if amount ≤ floor limit ($2,000 default)
- **Under limit:** approves with `storeAndForward: true`, terminal stores encrypted auth request
- **Over limit:** hard decline, UI shows "Amount exceeds offline limit ($2,000)"
- Store-and-forward transactions uploaded by payment bridge when connectivity returns

### Cash Handling

- Simple "Cash" button assumes exact tender
- No change calculation (disaster mode simplification)
- Transaction records `payment_method: "cash"` with no `payment_ref`

## Sync & Connectivity

### Inbound Sync (Central → Device)

| Data | Frequency | Trigger |
|------|-----------|---------|
| Products/prices | Every 4 hours when online | App startup, scheduled |
| Operators (PINs) | With product sync | Same as products |

- Full catalog refresh (~20MB)
- Stores `last_product_sync` timestamp in `sync_status`
- Runs in background goroutine, doesn't block UI

### Outbound Sync (Device → Central)

- Pending transactions uploaded when connectivity detected
- Each transaction marked `status: 'synced'` with `synced_at` timestamp
- Failed uploads retry with exponential backoff
- Transactions remain locally for 30 days after sync (audit trail)

### Connectivity Detection

Background goroutine pings central health endpoint every 30 seconds.

**Status endpoint (`GET /api/status`):**

```json
{
  "online": false,
  "lastOnline": "2025-12-07T14:30:00Z",
  "pendingTransactions": 12,
  "lastProductSync": "2025-12-07T06:00:00Z"
}
```

### UI Behavior Based on Status

| Condition | UI Behavior |
|-----------|-------------|
| `online: true` | Banner: "Primary systems available. Consider using main POS." |
| `online: false` | No banner, normal operation |
| `pendingTransactions > 0 && online` | "Syncing X transactions..." → "X transactions synced" |

JavaScript polls `/api/status` periodically to update banners.

## Receipts

### Output Strategy

1. **Attempt thermal print** - JavaScript sends print command to peripheral bridge
2. **Always show screen confirmation** - transaction summary displayed on complete page
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
| SQLite error | Fatal error: "System unavailable, contact support" |

### Manual Price Entry

For items not in the local catalog:

- Requires manager PIN to unlock (separate elevated PIN check)
- Enter UPC, description, price manually
- Flagged as `manual_entry: true` in transaction
- Flagged for review when synced to central

### Graceful Degradation Priority

1. **Always capture the sale** (core mission)
2. Accept card if possible, fall back to cash
3. Print if possible, always show screen
4. Sync when possible, never block on it

## Technology Stack

### Single Go Binary

- **Language:** Go 1.22+ (single binary, no runtime dependencies)
- **Database:** SQLite with WAL mode via `modernc.org/sqlite` (pure Go, no CGO)
- **HTTP:** Standard library `net/http` with `http.ServeMux`
- **Templates:** Go `html/template` (or Templ for type-safety)
- **Static files:** `embed.FS` to bundle JS/CSS into binary
- **Binary size:** ~15-20MB (including embedded assets)

### Frontend (Vanilla JS + ESM)

- **No framework** - plain JavaScript with ES modules
- **No bundler** - browsers natively support `<script type="module">`
- **No transpilation** - write modern JS, ship modern JS
- **Styling:** Plain CSS (or Pico CSS ~10KB for classless defaults)

### JavaScript Modules

```
/static/js/
├── main.js           # Entry point, imported by HTML pages
├── peripheral.js     # WebSocket client for bridge (scanner, payment, printer)
├── cart.js           # Cart operations (add, remove, update via fetch)
└── status.js         # Poll /api/status, update connectivity banners
```

Example usage in HTML:
```html
<script type="module">
  import { connectPeripherals } from '/static/js/peripheral.js';
  import { pollStatus } from '/static/js/status.js';

  connectPeripherals('ws://localhost:9100/peripherals');
  pollStatus();
</script>
```

### Why No Build Step?

| Concern | Solution |
|---------|----------|
| Module loading | Native ESM with `<script type="module">` |
| Bare imports | Not needed - use relative paths for own code |
| npm packages | None required - vanilla JS covers everything |
| Minification | Unnecessary - ~200 lines of JS total, served from localhost |
| TypeScript | Skip it - small codebase, runtime errors are acceptable |

For ~200 lines of JavaScript, build tooling adds complexity without benefit.

### Deployment Footprint

| Component | Size |
|-----------|------|
| Go binary (with embedded assets) | ~15-20MB |
| SQLite DB (full catalog) | ~20MB |
| **Total** | **~35-40MB** |

Compare to Node.js approach: ~50MB+ with node_modules.

## Project Structure

```
apps/offline-pos/
├── main.go                    # Entry point
├── go.mod
├── go.sum
│
├── internal/
│   ├── server/
│   │   ├── server.go          # HTTP server setup
│   │   ├── routes.go          # Route registration
│   │   └── middleware.go      # Session, logging
│   │
│   ├── handlers/
│   │   ├── pages.go           # HTML page handlers (login, scan, cart, etc.)
│   │   └── api.go             # JSON API handlers (/api/*)
│   │
│   ├── db/
│   │   ├── sqlite.go          # Connection, migrations
│   │   ├── products.go        # Product queries
│   │   ├── operators.go       # Operator/PIN queries
│   │   └── transactions.go    # Transaction queries
│   │
│   ├── sync/
│   │   ├── sync.go            # Background sync coordinator
│   │   ├── products.go        # Product catalog sync
│   │   └── transactions.go    # Transaction upload
│   │
│   └── session/
│       └── session.go         # Cookie-based session (operator PIN)
│
├── templates/                  # Go html/template files
│   ├── layout.html            # Base layout with header/footer
│   ├── login.html
│   ├── scan.html
│   ├── cart.html
│   ├── payment.html
│   └── complete.html
│
├── static/                     # Embedded via embed.FS
│   ├── js/
│   │   ├── peripheral.js      # WebSocket client for bridge
│   │   ├── cart.js            # Cart interactions
│   │   └── status.js          # Connectivity status polling
│   │
│   └── css/
│       └── styles.css         # Application styles
│
├── Dockerfile
└── README.md
```

### Key Design Decisions

- **`internal/`** - Go convention for non-exported packages
- **Handlers split** - `pages.go` returns HTML, `api.go` returns JSON
- **Templates separate** - Not embedded in Go code, easier to edit
- **Static embedded** - `//go:embed static` bundles assets into binary

### Monorepo Integration

- Lives under `apps/` alongside other applications
- Not part of Nx build graph (separate deployment, different toolchain)
- Own Dockerfile for containerized deployment to device
- `go build` produces single deployable artifact

## Testing Strategy

### Unit Tests (Go)

```bash
go test ./...
```

- `internal/db/*_test.go` - Query logic with in-memory SQLite
- `internal/sync/*_test.go` - Sync logic with mock HTTP server
- `internal/handlers/*_test.go` - Handler logic with mock dependencies

### Integration Tests (Go)

- Full HTTP server tests using `httptest`
- Real SQLite database (temp file)
- Test complete request/response cycles

### End-to-End (Playwright)

- Run against actual Go binary
- Mock peripheral bridge (WebSocket server with scripted responses)
- Device emulators from peripheral integration design

**Test scenarios:**

- Happy path: login → scan → cart → card payment → complete
- Offline card decline (over floor limit)
- Scanner unavailable fallback to manual entry
- Cash payment flow
- Receipt capture (email/phone)
- Connectivity status transitions

### Manual Testing

- Local dev with `go run .`
- Device emulators for scanner, payment terminal, printer
- Simulated offline mode (block central system endpoint)

### Development Workflow

```bash
# Run with live reload (using air or similar)
air

# Or simple rebuild
go build -o offline-pos . && ./offline-pos

# Run tests
go test ./...

# Build for deployment
go build -ldflags="-s -w" -o offline-pos .
```

## API Reference

### Pages (HTML)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Login page |
| POST | `/login` | Validate PIN, create session |
| GET | `/scan` | Scan/search page |
| GET | `/cart` | Cart review page |
| GET | `/payment` | Payment method selection |
| GET | `/complete` | Transaction complete confirmation |
| POST | `/logout` | Clear session |

### API (JSON)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/status` | Connectivity status, pending transaction count |
| GET | `/api/products/search?q=` | Search products by name or UPC |
| GET | `/api/products/:upc` | Get single product by UPC |
| POST | `/api/cart/add` | Add item to cart |
| POST | `/api/cart/update` | Update item quantity |
| POST | `/api/cart/remove` | Remove item from cart |
| GET | `/api/cart` | Get current cart contents |
| POST | `/api/transaction/complete` | Finalize transaction |

### Session Management

- Cookie-based session with operator PIN
- Session stored server-side (in-memory map, cleared on restart)
- Cart stored in session until transaction complete
- 30-minute inactivity timeout

## Related Documents

- [Peripheral Integration Design](2025-12-07-peripheral-integration-design.md) - Device abstraction layer, WebSocket protocol for scanner/payment/printer

## References

- [JavaScript Modules in 2025: ESM, Import Maps & Best Practices](https://siddsr0015.medium.com/javascript-modules-in-2025-esm-import-maps-best-practices-7b6996fa8ea3)
- [Why Vanilla JavaScript is Making a Comeback in 2025](https://dev.to/arkhan/why-vanilla-javascript-is-making-a-comeback-in-2025-4939)
- [Building Modern Web Apps with HTMX and Go](https://medium.com/@ashish.rising/building-modern-web-apps-with-htmx-and-go-4935a4624a39)
- [Go-Blueprint: HTMX and Templ](https://docs.go-blueprint.dev/advanced-flag/htmx-templ/)
