# 048C_OFFLINE_POS_SYNC

**Status: DRAFT**

---

## Overview

Implement the background sync service that downloads product/operator catalogs from central systems and uploads pending transactions when connectivity is available.

**Related Plans:**
- 048_OFFLINE_POS - Parent plan
- 048A_OFFLINE_POS_GO_INFRASTRUCTURE - Prerequisite
- 048B_OFFLINE_POS_DATABASE - Prerequisite (needs query functions)

## Goals

1. Background goroutine for connectivity detection
2. Inbound sync: products and operators from central
3. Outbound sync: pending transactions to central
4. Expose status via `/api/status` endpoint

## References

**Design:**
- `docs/ideas/2025-12-09-offline-pos-design.md` - Sync & Connectivity section

---

## Phase 1: Sync Coordinator

**Prereqs:** 048A, 048B complete
**Blockers:** Central system API specification (can mock initially)

### 1.1 Sync Service

**Files:**
- CREATE: `apps/offline-pos/internal/sync/sync.go`

**Implementation:**

```go
package sync

import (
    "context"
    "database/sql"
    "log"
    "sync/atomic"
    "time"

    "github.com/example/offline-pos/internal/db"
)

type Service struct {
    db            *sql.DB
    centralURL    string
    online        atomic.Bool
    lastOnline    atomic.Value // time.Time
    checkInterval time.Duration
    syncInterval  time.Duration
}

func NewService(database *sql.DB, centralURL string) *Service {
    s := &Service{
        db:            database,
        centralURL:    centralURL,
        checkInterval: 30 * time.Second,
        syncInterval:  4 * time.Hour,
    }
    s.lastOnline.Store(time.Time{})
    return s
}

func (s *Service) Start(ctx context.Context) {
    go s.connectivityLoop(ctx)
    go s.syncLoop(ctx)
    log.Println("Sync service started")
}

func (s *Service) IsOnline() bool {
    return s.online.Load()
}

func (s *Service) LastOnline() time.Time {
    return s.lastOnline.Load().(time.Time)
}

func (s *Service) Status() map[string]any {
    pending, _ := db.CountPendingTransactions(s.db)
    lastSync, _ := db.GetSyncStatus(s.db, "last_product_sync")
    return map[string]any{
        "online":              s.IsOnline(),
        "lastOnline":          s.LastOnline(),
        "pendingTransactions": pending,
        "lastProductSync":     lastSync,
    }
}
```

### 1.2 Connectivity Loop

**Implementation (in sync.go):**

```go
func (s *Service) connectivityLoop(ctx context.Context) {
    ticker := time.NewTicker(s.checkInterval)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            s.checkConnectivity()
        }
    }
}

func (s *Service) checkConnectivity() {
    client := &http.Client{Timeout: 5 * time.Second}
    resp, err := client.Get(s.centralURL + "/health")

    wasOnline := s.online.Load()
    nowOnline := err == nil && resp.StatusCode == 200

    s.online.Store(nowOnline)
    if nowOnline {
        s.lastOnline.Store(time.Now())
    }

    // Trigger sync on connectivity restored
    if !wasOnline && nowOnline {
        log.Println("Connectivity restored - triggering sync")
        go s.syncTransactions()
    }
}
```

---

## Phase 2: Inbound Sync (Products/Operators)

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Product Sync

**Files:**
- CREATE: `apps/offline-pos/internal/sync/products.go`

**Implementation:**

```go
package sync

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "time"

    "github.com/example/offline-pos/internal/db"
)

func (s *Service) syncLoop(ctx context.Context) {
    // Initial sync on startup
    s.syncCatalog()

    ticker := time.NewTicker(s.syncInterval)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            if s.IsOnline() {
                s.syncCatalog()
            }
        }
    }
}

func (s *Service) syncCatalog() {
    if !s.IsOnline() {
        return
    }

    log.Println("Starting catalog sync...")

    if err := s.syncProducts(); err != nil {
        log.Printf("Product sync failed: %v", err)
    }

    if err := s.syncOperators(); err != nil {
        log.Printf("Operator sync failed: %v", err)
    }

    db.SetSyncStatus(s.db, "last_product_sync", time.Now().Format(time.RFC3339))
    log.Println("Catalog sync complete")
}

func (s *Service) syncProducts() error {
    resp, err := http.Get(s.centralURL + "/api/products")
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    var products []db.Product
    if err := json.NewDecoder(resp.Body).Decode(&products); err != nil {
        return err
    }

    return db.ReplaceAllProducts(s.db, products)
}

func (s *Service) syncOperators() error {
    resp, err := http.Get(s.centralURL + "/api/operators")
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    var operators []db.Operator
    if err := json.NewDecoder(resp.Body).Decode(&operators); err != nil {
        return err
    }

    return db.ReplaceAllOperators(s.db, operators)
}
```

---

## Phase 3: Outbound Sync (Transactions)

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Transaction Upload

**Files:**
- CREATE: `apps/offline-pos/internal/sync/transactions.go`

**Implementation:**

```go
package sync

import (
    "bytes"
    "encoding/json"
    "log"
    "net/http"
    "time"

    "github.com/example/offline-pos/internal/db"
)

func (s *Service) syncTransactions() {
    if !s.IsOnline() {
        return
    }

    txns, err := db.GetPendingTransactions(s.db)
    if err != nil {
        log.Printf("Failed to get pending transactions: %v", err)
        return
    }

    if len(txns) == 0 {
        return
    }

    log.Printf("Uploading %d pending transactions...", len(txns))

    for _, txn := range txns {
        if err := s.uploadTransaction(txn); err != nil {
            log.Printf("Failed to upload transaction %s: %v", txn.ID, err)
            continue
        }

        if err := db.MarkTransactionSynced(s.db, txn.ID); err != nil {
            log.Printf("Failed to mark transaction %s synced: %v", txn.ID, err)
        }
    }

    log.Println("Transaction sync complete")
}

func (s *Service) uploadTransaction(txn db.Transaction) error {
    body, _ := json.Marshal(txn)

    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Post(
        s.centralURL+"/api/transactions",
        "application/json",
        bytes.NewReader(body),
    )
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        return fmt.Errorf("upload failed: %d", resp.StatusCode)
    }
    return nil
}
```

---

## Phase 4: Wire to Server

**Prereqs:** Phase 3 complete
**Blockers:** None

### 4.1 Update main.go

```go
func main() {
    // ... db setup ...

    centralURL := os.Getenv("CENTRAL_URL")
    if centralURL == "" {
        centralURL = "http://localhost:8080" // default for dev
    }

    syncSvc := sync.NewService(database, centralURL)
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()
    syncSvc.Start(ctx)

    srv := server.New(port, database, syncSvc)
    // ...
}
```

### 4.2 Update Status Endpoint

```go
func (h *APIHandlers) Status(w http.ResponseWriter, r *http.Request) {
    status := h.syncSvc.Status()
    json.NewEncoder(w).Encode(status)
}
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/offline-pos/internal/sync/sync.go` | Sync coordinator |
| CREATE | `apps/offline-pos/internal/sync/products.go` | Product/operator sync |
| CREATE | `apps/offline-pos/internal/sync/transactions.go` | Transaction upload |
| MODIFY | `apps/offline-pos/main.go` | Wire sync service |
| MODIFY | `apps/offline-pos/internal/handlers/api.go` | Status endpoint |

## Testing Strategy

```go
// internal/sync/sync_test.go
func TestConnectivityDetection(t *testing.T) {
    // Start mock server that returns 200
    mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(200)
    }))
    defer mockServer.Close()

    db, _ := sql.Open("sqlite", ":memory:")
    svc := NewService(db, mockServer.URL)

    svc.checkConnectivity()

    if !svc.IsOnline() {
        t.Error("expected online after successful health check")
    }
}
```

## Checklist

- [ ] Connectivity detection working
- [ ] Product sync downloads and stores
- [ ] Operator sync downloads and stores
- [ ] Transaction upload works
- [ ] Retry with backoff on failure
- [ ] Status endpoint returns correct data
- [ ] All tests pass
