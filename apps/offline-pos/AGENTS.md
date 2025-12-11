# Offline POS Agent Guidelines

This is a Go-based disaster recovery POS application. Unlike the Java Spring Boot services in this repository, this application uses Go's standard library with minimal dependencies for maximum simplicity and reliability.

## Key Files

| File | Purpose |
|------|---------|
| `main.go` | Entry point with embed.FS directives for templates and static assets |
| `internal/server/server.go` | HTTP server initialization with chi/standard library router |
| `internal/server/routes.go` | Route registration (pages and API endpoints) |
| `internal/handlers/pages.go` | Page rendering with Go html/template |
| `internal/handlers/api.go` | JSON API handlers for cart and products |
| `internal/db/sqlite.go` | Database connection with singleton pattern and WAL mode |
| `internal/db/migrations.go` | Schema migrations (run on startup) |
| `internal/sync/sync.go` | Background sync service with connectivity monitoring |
| `internal/session/session.go` | Cookie-based session management |
| `.air.toml` | Hot reload configuration for development |

## Key Patterns

### embed.FS for Asset Embedding

Templates and static files are embedded into the binary:

```go
//go:embed templates/*
var templatesFS embed.FS

//go:embed static/*
var staticFS embed.FS
```

This enables single binary deployment with zero external dependencies.

### STOMP WebSocket Integration

The frontend connects to the peripheral emulator via STOMP:

```javascript
// static/js/peripheral.js
const client = new StompClient('ws://localhost:9100/stomp');
client.subscribe('/topic/scanner/events', handleScan);
client.subscribe('/topic/payment/events', handlePayment);
```

Handlers in `static/js/` process events and update the UI.

### SQLite WAL Mode

Database opens with Write-Ahead Logging for better concurrency:

```go
db, err := sql.Open("sqlite", path+"?_pragma=journal_mode(WAL)")
```

WAL mode provides:
- Readers don't block writers
- Writers don't block readers
- Atomic commits
- Better crash recovery

### Session Management

Sessions use in-memory storage with cookie-based session IDs:

```go
// internal/session/session.go
type Session struct {
    ID          string
    OperatorPIN string
    Cart        []db.LineItem
    CreatedAt   time.Time
}

// Cookie sent to browser
http.SetCookie(w, &http.Cookie{
    Name:  "session_id",
    Value: sessionID,
})
```

**Note**: In-memory sessions are lost on restart. This is acceptable for disaster recovery scenarios where the POS runs continuously during an outage.

### Background Sync Service

Two goroutines handle sync operations:

```go
// Connectivity monitoring (every 30s)
func (s *Service) connectivityLoop(ctx context.Context)

// Periodic sync (every 4h)
func (s *Service) syncLoop(ctx context.Context)
```

**Triggers:**
- Product sync: Every 4 hours when online
- Transaction sync: Immediately when connectivity restored

## File Organization

### internal/server/

HTTP server setup and middleware:
- `server.go` - Server struct, initialization, Run()
- `routes.go` - Route registration
- `middleware.go` - Logging, session middleware

### internal/handlers/

HTTP request handlers:
- `pages.go` - Page rendering (Login, Scan, Cart, Payment, Complete)
- `api.go` - JSON API endpoints (Status, Products, Cart, Transactions)

### internal/db/

Database layer (one file per domain):
- `sqlite.go` - Connection management with singleton pattern
- `migrations.go` - Schema definitions
- `products.go` - Product queries (search, get by UPC)
- `transactions.go` - Transaction persistence
- `operators.go` - Operator authentication
- `sync_status.go` - Sync timestamp tracking

### internal/sync/

Background synchronization:
- `sync.go` - Service initialization, connectivity loop
- `products.go` - Product catalog download
- `transactions.go` - Transaction upload

### templates/

Go html/template files:
- `layout.html` - Base layout with navigation
- `login.html`, `scan.html`, `cart.html`, `payment.html`, `complete.html` - Page templates

### static/

Embedded static assets (vanilla JavaScript):
- `css/pico.min.css` - Pico CSS framework
- `css/styles.css` - Custom styles
- `js/stomp.js` - STOMP WebSocket client library
- `js/peripheral.js` - Peripheral bridge integration
- `js/cart.js` - Cart UI interactions
- `js/status.js` - Connectivity status indicator

## Testing Guidance

### Unit Tests

Test business logic in isolation:

```go
// internal/db/products_test.go
func TestSearchProducts(t *testing.T) {
    db := setupTestDB(t)
    defer db.Close()

    products, err := SearchProducts(db, "widget", 10)
    if err != nil {
        t.Fatal(err)
    }
    if len(products) == 0 {
        t.Error("expected products, got none")
    }
}
```

### Integration Tests

Test HTTP handlers with httptest:

```go
// internal/handlers/api_test.go
func TestGetProduct(t *testing.T) {
    db := setupTestDB(t)
    h := NewAPIHandlers(db, nil)

    req := httptest.NewRequest("GET", "/api/products/0012345678905", nil)
    w := httptest.NewRecorder()

    h.GetProduct(w, req)

    if w.Code != http.StatusOK {
        t.Errorf("expected 200, got %d", w.Code)
    }
}
```

### Run Tests

```bash
cd apps/offline-pos
go test ./...
```

## Common Tasks

### Add a New Route

1. **Add handler** in `internal/handlers/pages.go` or `api.go`:
   ```go
   func (h *PageHandlers) NewPage(w http.ResponseWriter, r *http.Request) {
       executeTemplate(w, h.templatesFS, "templates/newpage.html", nil)
   }
   ```

2. **Register route** in `internal/server/routes.go`:
   ```go
   s.router.HandleFunc("GET /newpage", pages.NewPage)
   ```

3. **Create template** (for pages) in `templates/newpage.html`:
   ```html
   {{define "newpage"}}
   {{template "layout" .}}
   {{define "content"}}
   <main>
     <!-- Page content -->
   </main>
   {{end}}
   {{end}}
   ```

### Add a Database Query

1. **Add function** in appropriate `internal/db/*.go` file:
   ```go
   func GetItemsByCategory(db *sql.DB, category string) ([]Product, error) {
       rows, err := db.Query(
           "SELECT id, upc, name, price_cents FROM products WHERE category = ?",
           category,
       )
       if err != nil {
           return nil, err
       }
       defer rows.Close()

       var products []Product
       for rows.Next() {
           var p Product
           if err := rows.Scan(&p.ID, &p.UPC, &p.Name, &p.PriceCents); err != nil {
               return nil, err
           }
           products = append(products, p)
       }
       return products, rows.Err()
   }
   ```

2. **Use in handler**:
   ```go
   products, err := db.GetItemsByCategory(h.db, "electronics")
   if err != nil {
       http.Error(w, "Database error", http.StatusInternalServerError)
       return
   }
   ```

### Add a Migration

1. **Update** `internal/db/migrations.go`:
   ```go
   func runMigrations(db *sql.DB) error {
       migrations := []string{
           // Existing migrations...
           `CREATE TABLE IF NOT EXISTS new_table (
               id INTEGER PRIMARY KEY AUTOINCREMENT,
               field1 TEXT NOT NULL,
               field2 INTEGER,
               created_at DATETIME DEFAULT CURRENT_TIMESTAMP
           )`,
       }
       // Migration execution code...
   }
   ```

2. **Test migration** by deleting and recreating the database:
   ```bash
   rm offline-pos.db
   go run .
   ```

### Add Sync Endpoint

1. **Add sync function** in `internal/sync/`:
   ```go
   // internal/sync/newdata.go
   func (s *Service) syncNewData() error {
       if !s.IsOnline() {
           return nil
       }

       resp, err := http.Get(s.centralURL + "/api/newdata")
       if err != nil {
           return err
       }
       defer resp.Body.Close()

       // Process and store data
       return nil
   }
   ```

2. **Call from sync loop** in `sync.go`:
   ```go
   func (s *Service) syncLoop(ctx context.Context) {
       ticker := time.NewTicker(s.syncInterval)
       defer ticker.Stop()

       for {
           select {
           case <-ctx.Done():
               return
           case <-ticker.C:
               if s.IsOnline() {
                   s.syncProducts()
                   s.syncNewData() // Add here
               }
           }
       }
   }
   ```

## Anti-patterns to Avoid

- **Blocking the main goroutine** - Use goroutines for background work
- **Ignoring context cancellation** - Always respect ctx.Done() in loops
- **Not closing rows/statements** - Use defer rows.Close() and stmt.Close()
- **Hardcoding URLs** - Use environment variables for configuration
- **Complex JavaScript builds** - Keep vanilla JS simple, no transpilation needed
- **External template files in production** - Always use embed.FS
- **Thread-unsafe session access** - Use sync.Mutex if adding shared state

## What's Different from Java Services

This Go application differs from the Java Spring Boot services in this monorepo:

| Aspect | Java Services | Offline POS (Go) |
|--------|--------------|------------------|
| Framework | Spring Boot + WebFlux | Standard library + net/http |
| Database | PostgreSQL/Redis | SQLite with WAL |
| Templates | Thymeleaf | Go html/template |
| Frontend | React + Vite | Vanilla JavaScript ESM |
| Packaging | JAR + Docker | Single binary |
| Logging | Structured JSON | Standard log package |
| Security | OAuth2 + JWT | PIN-based (offline) |
| Deployment | Kubernetes | Edge device / laptop |

## Development Workflow

### Hot Reload

```bash
cd apps/offline-pos
air
```

Air watches for changes and rebuilds automatically. Config in `.air.toml`.

### Manual Testing

```bash
# Terminal 1: Start peripheral emulator
pnpm nx serve peripheral-emulator

# Terminal 2: Start offline POS
pnpm nx serve offline-pos

# Browser
open http://localhost:3000
```

### Debugging

Go's built-in tooling:

```bash
# Run with race detector
go run -race .

# Profile CPU
go run . -cpuprofile=cpu.prof

# Profile memory
go run . -memprofile=mem.prof
```

## Configuration

All configuration via environment variables (12-factor app):

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | HTTP server port | 3000 |
| `DB_PATH` | SQLite database file | ./offline-pos.db |
| `CENTRAL_URL` | Central systems base URL | http://localhost:8080 |

No configuration files needed - minimal setup for disaster scenarios.

## Peripheral Integration

The UI connects to the peripheral emulator via WebSocket/STOMP:

```javascript
// static/js/peripheral.js connects to ws://localhost:9100/stomp

// Scanner events
client.subscribe('/topic/scanner/events', (message) => {
    const { barcode } = JSON.parse(message.body);
    addProductByUPC(barcode);
});

// Payment events
client.subscribe('/topic/payment/events', (message) => {
    const { state, result } = JSON.parse(message.body);
    handlePaymentState(state, result);
});
```

See [Peripheral Emulator README](../peripheral-emulator/README.md) for protocol details.

## See Also

- [Implementation Plan](../../docs/plans/active/048_OFFLINE_POS.md)
- [ADR 013: Offline Data Store](../../docs/ADRs/013_offline_data_store.md)
- [ADR 014: Offline POS Technology Stack](../../docs/ADRs/014_offline_pos_technology_stack.md)
- [Peripheral Emulator](../peripheral-emulator/README.md)
