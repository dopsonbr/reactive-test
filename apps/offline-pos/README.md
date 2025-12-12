# Offline POS

Disaster recovery point-of-sale system that runs as a single Go binary with SQLite storage and vanilla JavaScript frontend. Captures sales when primary systems are unavailable and syncs transactions when connectivity returns.

## Features

- **Single Binary Deployment**: ~15-20MB executable with embedded assets
- **Offline-First**: SQLite database with WAL mode for durability
- **Background Sync**: Products sync down, transactions sync up when online
- **Multi-Page UI**: HTML templates with vanilla JavaScript (no build step)
- **Peripheral Integration**: WebSocket client for scanner, payment terminal, and printer
- **Session Management**: Cookie-based sessions with in-memory cart
- **Connectivity Monitoring**: Auto-detect when central systems return

## Prerequisites

- **Go 1.22+** (for building)
- **Air** (optional - for hot reload during development)

## Quick Start

### Using Nx (Recommended)

```bash
# Run with hot reload
pnpm nx serve offline-pos

# Build binary
pnpm nx build offline-pos
```

### Using Go Directly

```bash
cd apps/offline-pos

# Run application
go run .

# Build binary
go build -o offline-pos .

# Run binary
./offline-pos
```

### Using Air (Hot Reload)

```bash
cd apps/offline-pos
air
```

**Application URL:** http://localhost:3000

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | HTTP server port |
| `DB_PATH` | ./offline-pos.db | SQLite database file path |
| `CENTRAL_URL` | http://localhost:8080 | Central systems URL for sync |

### Example Configuration

```bash
export PORT=3000
export DB_PATH=/data/offline-pos.db
export CENTRAL_URL=https://central-api.example.com
./offline-pos
```

## Project Structure

```
apps/offline-pos/
├── main.go                          # Entry point, embedded FS
├── go.mod                           # Go module dependencies
├── .air.toml                        # Air hot reload config
├── project.json                     # Nx configuration
├── internal/
│   ├── server/                      # HTTP server setup
│   │   ├── server.go                # Server initialization
│   │   ├── routes.go                # Route registration
│   │   └── middleware.go            # Logging, session middleware
│   ├── handlers/                    # HTTP handlers
│   │   ├── pages.go                 # Page rendering (login, scan, cart, etc.)
│   │   └── api.go                   # JSON API endpoints
│   ├── db/                          # Database layer
│   │   ├── sqlite.go                # Connection management
│   │   ├── migrations.go            # Schema migrations
│   │   ├── products.go              # Product queries
│   │   ├── transactions.go          # Transaction queries
│   │   ├── operators.go             # Operator queries
│   │   └── sync_status.go           # Sync status tracking
│   ├── sync/                        # Background sync service
│   │   ├── sync.go                  # Service initialization and loops
│   │   ├── products.go              # Product catalog sync
│   │   └── transactions.go          # Transaction upload sync
│   └── session/                     # Session management
│       └── session.go               # Cookie-based sessions
├── templates/                       # Go html/template files
│   ├── layout.html                  # Base layout
│   ├── login.html                   # Operator login
│   ├── scan.html                    # Scan page
│   ├── cart.html                    # Cart review
│   ├── payment.html                 # Payment collection
│   └── complete.html                # Transaction complete
├── static/                          # Static assets (embedded)
│   ├── css/
│   │   ├── pico.min.css             # Pico CSS framework
│   │   └── styles.css               # Custom styles
│   └── js/
│       ├── stomp.js                 # STOMP WebSocket client
│       ├── peripheral.js            # Peripheral bridge integration
│       ├── cart.js                  # Cart interactions
│       └── status.js                # Connectivity status
└── tools/                           # Development tools
    └── seed-data.sql                # Sample data for development
```

## API Endpoints

### Status

```http
GET /api/status
```

Returns current sync status and connectivity.

**Response:**
```json
{
  "online": true,
  "lastOnline": "2025-12-10T12:34:56Z",
  "pendingTransactions": 5,
  "lastProductSync": "2025-12-10T08:00:00Z"
}
```

### Product Search

```http
GET /api/products/search?q={query}
```

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| q | Yes | Search query (product name or UPC) |

**Response:**
```json
[
  {
    "id": 1,
    "upc": "0012345678905",
    "name": "Product Name",
    "priceCents": 2999
  }
]
```

### Get Product

```http
GET /api/products/{upc}
```

**Response:**
```json
{
  "id": 1,
  "upc": "0012345678905",
  "name": "Product Name",
  "priceCents": 2999
}
```

### Cart Management

```http
# Get current cart
GET /api/cart

# Add to cart
POST /api/cart/add
Content-Type: application/json
{
  "upc": "0012345678905",
  "quantity": 1
}

# Update cart item
POST /api/cart/update
Content-Type: application/json
{
  "upc": "0012345678905",
  "quantity": 2
}

# Remove from cart
POST /api/cart/remove
Content-Type: application/json
{
  "upc": "0012345678905"
}
```

### Complete Transaction

```http
POST /api/transaction/complete
Content-Type: application/json
{
  "payment_method": "chip",
  "payment_ref": "AUTH-12345",
  "customer_email": "customer@example.com",
  "customer_phone": "555-0123"
}
```

**Response:**
```json
{
  "transaction_id": 123,
  "total": "2999"
}
```

## Page Routes

| Route | Description |
|-------|-------------|
| `GET /` | Operator login page |
| `POST /login` | Login handler |
| `GET /scan` | Scan items page |
| `GET /cart` | Review cart page |
| `GET /payment` | Payment collection page |
| `GET /complete` | Transaction complete page |
| `POST /logout` | Logout handler |

## Database

### SQLite WAL Mode

The application uses SQLite with Write-Ahead Logging (WAL) mode for:
- Better concurrency
- Atomic commits
- Crash recovery

### Schema

**Tables:**
- `products` - Local product catalog (synced from central)
- `operators` - POS operators (PIN-based login)
- `transactions` - Completed transactions (queued for upload)
- `sync_status` - Tracks last sync times

### Migrations

Migrations run automatically on startup via `db.Open()`. See `internal/db/migrations.go`.

## Development

### Hot Reload with Air

The `.air.toml` configuration watches for changes to:
- `*.go` files
- `*.html` templates
- `*.css` stylesheets
- `*.js` scripts

```bash
cd apps/offline-pos
air
```

Changes trigger automatic rebuild and restart.

### Mock Peripheral Bridge

For development without real hardware:

```bash
# Terminal 1: Start peripheral emulator
pnpm nx serve peripheral-emulator

# Terminal 2: Start offline POS
pnpm nx serve offline-pos
```

The UI automatically connects to `ws://localhost:9100/stomp` for scanner and payment events.

### Design System Tokens

The offline-pos app uses design tokens copied from `libs/frontend/shared-design/tokens/` for visual consistency with the main e-commerce application.

**Token files:**
- `static/css/tokens.css` - CSS custom properties (colors, typography, spacing)
- `static/css/pico-overrides.css` - Maps tokens to Pico CSS variables

**Syncing tokens:**
When design tokens change in `libs/frontend/shared-design/tokens/src/`, manually update `static/css/tokens.css`:

1. Copy updated values from source files:
   - `colors.css` - Color palette and semantic colors
   - `typography.css` - Font families, sizes, weights
   - `spacing.css` - Spacing scale and border radii

2. Only copy light mode values (omit `.dark` selectors)

3. Test visual appearance: `pnpm nx serve offline-pos`

### Seeding Test Data

```bash
cd apps/offline-pos
sqlite3 offline-pos.db < tools/seed-data.sql
```

## Testing

```bash
# Run all tests
pnpm nx test offline-pos

# Or with Go directly
cd apps/offline-pos
go test ./...
```

## Building

### Local Binary

```bash
# Build optimized binary
pnpm nx build offline-pos

# Output: dist/apps/offline-pos/offline-pos
```

### Docker

```bash
# Build image
docker build -t offline-pos:latest apps/offline-pos

# Run container
docker run -p 3000:3000 \
  -e CENTRAL_URL=https://central-api.example.com \
  -v /data/offline-pos.db:/app/offline-pos.db \
  offline-pos:latest
```

## Background Sync

### Product Sync (Down)

- **Frequency**: Every 4 hours
- **Endpoint**: `GET {CENTRAL_URL}/api/products`
- **Behavior**: Full refresh of local product catalog

### Transaction Sync (Up)

- **Trigger**: Connectivity restored
- **Endpoint**: `POST {CENTRAL_URL}/api/transactions`
- **Behavior**: Upload pending transactions individually, mark as synced

### Connectivity Check

- **Frequency**: Every 30 seconds
- **Endpoint**: `GET {CENTRAL_URL}/health`
- **Behavior**: Sets online/offline status, triggers transaction sync on reconnect

## Common Tasks

### Add a New Page Route

1. Create template in `templates/`:
   ```html
   {{define "newpage"}}
   {{template "layout" .}}
   {{define "content"}}
   <!-- Page content -->
   {{end}}
   {{end}}
   ```

2. Add handler in `internal/handlers/pages.go`:
   ```go
   func (h *PageHandlers) NewPage(w http.ResponseWriter, r *http.Request) {
       executeTemplate(w, h.templatesFS, "templates/newpage.html", nil)
   }
   ```

3. Register route in `internal/server/routes.go`:
   ```go
   s.router.HandleFunc("GET /newpage", pages.NewPage)
   ```

### Add a New API Endpoint

1. Add handler in `internal/handlers/api.go`:
   ```go
   func (h *APIHandlers) NewEndpoint(w http.ResponseWriter, r *http.Request) {
       // Implementation
       w.Header().Set("Content-Type", "application/json")
       json.NewEncoder(w).Encode(response)
   }
   ```

2. Register route in `internal/server/routes.go`:
   ```go
   s.router.HandleFunc("GET /api/newendpoint", api.NewEndpoint)
   ```

### Add a Database Query

1. Add function in appropriate `internal/db/*.go` file:
   ```go
   func GetSomething(db *sql.DB, id int) (*Something, error) {
       row := db.QueryRow("SELECT * FROM table WHERE id = ?", id)
       var s Something
       err := row.Scan(&s.Field1, &s.Field2)
       return &s, err
   }
   ```

2. Use in handler:
   ```go
   result, err := db.GetSomething(h.db, id)
   if err != nil {
       http.Error(w, "Database error", http.StatusInternalServerError)
       return
   }
   ```

## See Also

- [Implementation Plan](../../docs/plans/active/048_OFFLINE_POS.md)
- [Peripheral Emulator](../peripheral-emulator/README.md)
- [ADR 013: Offline Data Store](../../docs/ADRs/013_offline_data_store.md)
- [ADR 014: Offline POS Technology Stack](../../docs/ADRs/014_offline_pos_technology_stack.md)
