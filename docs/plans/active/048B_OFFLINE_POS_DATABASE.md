# 048B_OFFLINE_POS_DATABASE

**Status: DRAFT**

---

## Overview

Implement the SQLite database layer for the Offline POS application. This includes schema definition, migrations, and query functions for products, operators, transactions, and sync metadata.

**Related Plans:**
- 048_OFFLINE_POS - Parent plan
- 048A_OFFLINE_POS_GO_INFRASTRUCTURE - Prerequisite
- 048C_OFFLINE_POS_SYNC - Depends on this plan

## Goals

1. SQLite database with WAL mode for concurrent reads
2. Schema migrations embedded in binary
3. Query functions for all tables
4. Session-based cart storage

## References

**ADRs:**
- `docs/ADRs/013_offline_data_store.md` - SQLite decision

**Design:**
- `docs/ideas/2025-12-09-offline-pos-design.md` - Data model section

---

## Phase 1: SQLite Connection

**Prereqs:** 048A complete (project structure exists)
**Blockers:** None

### 1.1 Database Package

**Files:**
- CREATE: `apps/offline-pos/internal/db/sqlite.go`

**Implementation:**

```go
package db

import (
    "database/sql"
    "log"
    "sync"

    _ "modernc.org/sqlite"
)

var (
    instance *sql.DB
    once     sync.Once
)

func Open(path string) (*sql.DB, error) {
    var err error
    once.Do(func() {
        instance, err = sql.Open("sqlite", path+"?_pragma=journal_mode(WAL)")
        if err != nil {
            return
        }
        if err = instance.Ping(); err != nil {
            return
        }
        if err = runMigrations(instance); err != nil {
            return
        }
        log.Printf("Database opened: %s", path)
    })
    return instance, err
}

func Close() error {
    if instance != nil {
        return instance.Close()
    }
    return nil
}
```

### 1.2 Migrations

**Files:**
- CREATE: `apps/offline-pos/internal/db/migrations.go`

**Implementation:**

```go
package db

import "database/sql"

func runMigrations(db *sql.DB) error {
    migrations := []string{
        `CREATE TABLE IF NOT EXISTS products (
            upc TEXT PRIMARY KEY,
            sku TEXT,
            name TEXT NOT NULL,
            price_cents INTEGER NOT NULL,
            department TEXT,
            tax_rate INTEGER DEFAULT 0,
            updated_at TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS operators (
            pin TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            employee_id TEXT,
            is_manager INTEGER DEFAULT 0,
            updated_at TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            operator_pin TEXT NOT NULL,
            items_json TEXT NOT NULL,
            subtotal INTEGER NOT NULL,
            tax INTEGER NOT NULL,
            total INTEGER NOT NULL,
            payment_method TEXT,
            payment_ref TEXT,
            customer_email TEXT,
            customer_phone TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            synced_at TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS sync_status (
            key TEXT PRIMARY KEY,
            value TEXT
        )`,
        `CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`,
        `CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`,
    }

    for _, m := range migrations {
        if _, err := db.Exec(m); err != nil {
            return err
        }
    }
    return nil
}
```

---

## Phase 2: Query Functions

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Product Queries

**Files:**
- CREATE: `apps/offline-pos/internal/db/products.go`

**Implementation:**

```go
package db

import "database/sql"

type Product struct {
    UPC        string
    SKU        string
    Name       string
    PriceCents int
    Department string
    TaxRate    int // × 10000 (e.g., 8.25% = 82500)
}

func GetProductByUPC(db *sql.DB, upc string) (*Product, error) {
    var p Product
    err := db.QueryRow(
        `SELECT upc, sku, name, price_cents, department, tax_rate
         FROM products WHERE upc = ?`, upc,
    ).Scan(&p.UPC, &p.SKU, &p.Name, &p.PriceCents, &p.Department, &p.TaxRate)
    if err == sql.ErrNoRows {
        return nil, nil
    }
    return &p, err
}

func SearchProducts(db *sql.DB, query string, limit int) ([]Product, error) {
    rows, err := db.Query(
        `SELECT upc, sku, name, price_cents, department, tax_rate
         FROM products WHERE name LIKE ? OR upc LIKE ? LIMIT ?`,
        "%"+query+"%", "%"+query+"%", limit,
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var products []Product
    for rows.Next() {
        var p Product
        rows.Scan(&p.UPC, &p.SKU, &p.Name, &p.PriceCents, &p.Department, &p.TaxRate)
        products = append(products, p)
    }
    return products, rows.Err()
}

func ReplaceAllProducts(db *sql.DB, products []Product) error {
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    defer tx.Rollback()

    tx.Exec("DELETE FROM products")
    stmt, _ := tx.Prepare(
        `INSERT INTO products (upc, sku, name, price_cents, department, tax_rate, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    defer stmt.Close()

    for _, p := range products {
        stmt.Exec(p.UPC, p.SKU, p.Name, p.PriceCents, p.Department, p.TaxRate)
    }
    return tx.Commit()
}
```

### 2.2 Operator Queries

**Files:**
- CREATE: `apps/offline-pos/internal/db/operators.go`

**Implementation:**

```go
package db

import "database/sql"

type Operator struct {
    PIN        string
    Name       string
    EmployeeID string
    IsManager  bool
}

func ValidateOperator(db *sql.DB, pin string) (*Operator, error) {
    var o Operator
    var isManager int
    err := db.QueryRow(
        `SELECT pin, name, employee_id, is_manager FROM operators WHERE pin = ?`, pin,
    ).Scan(&o.PIN, &o.Name, &o.EmployeeID, &isManager)
    if err == sql.ErrNoRows {
        return nil, nil
    }
    o.IsManager = isManager == 1
    return &o, err
}

func ReplaceAllOperators(db *sql.DB, operators []Operator) error {
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    defer tx.Rollback()

    tx.Exec("DELETE FROM operators")
    stmt, _ := tx.Prepare(
        `INSERT INTO operators (pin, name, employee_id, is_manager, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
    )
    defer stmt.Close()

    for _, o := range operators {
        manager := 0
        if o.IsManager {
            manager = 1
        }
        stmt.Exec(o.PIN, o.Name, o.EmployeeID, manager)
    }
    return tx.Commit()
}
```

### 2.3 Transaction Queries

**Files:**
- CREATE: `apps/offline-pos/internal/db/transactions.go`

**Implementation:**

```go
package db

import (
    "database/sql"
    "encoding/json"

    "github.com/google/uuid"
)

type LineItem struct {
    UPC         string `json:"upc"`
    Name        string `json:"name"`
    PriceCents  int    `json:"price_cents"`
    Quantity    int    `json:"quantity"`
    ManualEntry bool   `json:"manual_entry,omitempty"`
}

type Transaction struct {
    ID            string
    OperatorPIN   string
    Items         []LineItem
    Subtotal      int
    Tax           int
    Total         int
    PaymentMethod string
    PaymentRef    string
    CustomerEmail string
    CustomerPhone string
    Status        string
    CreatedAt     string
}

func CreateTransaction(db *sql.DB, t *Transaction) error {
    t.ID = uuid.New().String()
    itemsJSON, _ := json.Marshal(t.Items)
    _, err := db.Exec(
        `INSERT INTO transactions
         (id, operator_pin, items_json, subtotal, tax, total, payment_method,
          payment_ref, customer_email, customer_phone, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
        t.ID, t.OperatorPIN, itemsJSON, t.Subtotal, t.Tax, t.Total,
        t.PaymentMethod, t.PaymentRef, t.CustomerEmail, t.CustomerPhone,
    )
    return err
}

func GetPendingTransactions(db *sql.DB) ([]Transaction, error) {
    rows, err := db.Query(
        `SELECT id, operator_pin, items_json, subtotal, tax, total,
                payment_method, payment_ref, customer_email, customer_phone, created_at
         FROM transactions WHERE status = 'pending'`,
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var txns []Transaction
    for rows.Next() {
        var t Transaction
        var itemsJSON string
        rows.Scan(&t.ID, &t.OperatorPIN, &itemsJSON, &t.Subtotal, &t.Tax, &t.Total,
            &t.PaymentMethod, &t.PaymentRef, &t.CustomerEmail, &t.CustomerPhone, &t.CreatedAt)
        json.Unmarshal([]byte(itemsJSON), &t.Items)
        t.Status = "pending"
        txns = append(txns, t)
    }
    return txns, rows.Err()
}

func MarkTransactionSynced(db *sql.DB, id string) error {
    _, err := db.Exec(
        `UPDATE transactions SET status = 'synced', synced_at = datetime('now') WHERE id = ?`, id,
    )
    return err
}

func CountPendingTransactions(db *sql.DB) (int, error) {
    var count int
    err := db.QueryRow(`SELECT COUNT(*) FROM transactions WHERE status = 'pending'`).Scan(&count)
    return count, err
}
```

### 2.4 Sync Status Queries

**Files:**
- CREATE: `apps/offline-pos/internal/db/sync_status.go`

**Implementation:**

```go
package db

import "database/sql"

func GetSyncStatus(db *sql.DB, key string) (string, error) {
    var value string
    err := db.QueryRow(`SELECT value FROM sync_status WHERE key = ?`, key).Scan(&value)
    if err == sql.ErrNoRows {
        return "", nil
    }
    return value, err
}

func SetSyncStatus(db *sql.DB, key, value string) error {
    _, err := db.Exec(
        `INSERT INTO sync_status (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        key, value,
    )
    return err
}
```

---

## Phase 3: Session-Based Cart

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Session Package

**Files:**
- CREATE: `apps/offline-pos/internal/session/session.go`

**Implementation:**

```go
package session

import (
    "crypto/rand"
    "encoding/hex"
    "sync"
    "time"

    "github.com/example/offline-pos/internal/db"
)

type Session struct {
    ID          string
    OperatorPIN string
    Operator    *db.Operator
    Cart        []db.LineItem
    CreatedAt   time.Time
    LastAccess  time.Time
}

var (
    sessions = make(map[string]*Session)
    mu       sync.RWMutex
)

func Create(op *db.Operator) *Session {
    id := generateID()
    s := &Session{
        ID:          id,
        OperatorPIN: op.PIN,
        Operator:    op,
        Cart:        []db.LineItem{},
        CreatedAt:   time.Now(),
        LastAccess:  time.Now(),
    }
    mu.Lock()
    sessions[id] = s
    mu.Unlock()
    return s
}

func Get(id string) *Session {
    mu.RLock()
    defer mu.RUnlock()
    if s, ok := sessions[id]; ok {
        s.LastAccess = time.Now()
        return s
    }
    return nil
}

func Delete(id string) {
    mu.Lock()
    delete(sessions, id)
    mu.Unlock()
}

func generateID() string {
    b := make([]byte, 16)
    rand.Read(b)
    return hex.EncodeToString(b)
}
```

---

## Phase 4: Wire Database to Handlers

**Prereqs:** Phase 3 complete
**Blockers:** None

### 4.1 Update main.go

Pass database to server:

```go
func main() {
    dbPath := os.Getenv("DB_PATH")
    if dbPath == "" {
        dbPath = "./offline-pos.db"
    }

    database, err := db.Open(dbPath)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    srv := server.New(port, database)
    // ...
}
```

### 4.2 Update Handlers

Inject database into handlers and implement actual queries.

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/offline-pos/internal/db/sqlite.go` | Database connection |
| CREATE | `apps/offline-pos/internal/db/migrations.go` | Schema migrations |
| CREATE | `apps/offline-pos/internal/db/products.go` | Product queries |
| CREATE | `apps/offline-pos/internal/db/operators.go` | Operator queries |
| CREATE | `apps/offline-pos/internal/db/transactions.go` | Transaction queries |
| CREATE | `apps/offline-pos/internal/db/sync_status.go` | Sync metadata |
| CREATE | `apps/offline-pos/internal/session/session.go` | In-memory sessions |
| MODIFY | `apps/offline-pos/main.go` | Wire database |
| MODIFY | `apps/offline-pos/internal/handlers/*.go` | Use database |

## Testing Strategy

```go
// internal/db/products_test.go
func TestProductSearch(t *testing.T) {
    db, _ := sql.Open("sqlite", ":memory:")
    runMigrations(db)

    ReplaceAllProducts(db, []Product{
        {UPC: "123", Name: "Test Product", PriceCents: 999},
    })

    products, _ := SearchProducts(db, "Test", 10)
    if len(products) != 1 {
        t.Errorf("expected 1 product, got %d", len(products))
    }
}
```

## Checklist

- [ ] SQLite opens with WAL mode
- [ ] Migrations run on startup
- [ ] Product CRUD works
- [ ] Operator validation works
- [ ] Transaction creation/query works
- [ ] Session cart storage works
- [ ] All tests pass
