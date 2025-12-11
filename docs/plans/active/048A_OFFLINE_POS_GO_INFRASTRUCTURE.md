# 048A_OFFLINE_POS_GO_INFRASTRUCTURE

**Status: DRAFT**

---

## Overview

Set up the Go project structure, HTTP server, routing, and static asset embedding for the Offline POS application. This is the foundation that all other sub-plans build upon.

**Related Plans:**
- 048_OFFLINE_POS - Parent plan
- 048B_OFFLINE_POS_DATABASE - Depends on this plan
- 048D_OFFLINE_POS_UI - Depends on this plan

## Goals

1. Initialize Go module with proper dependencies
2. HTTP server with routing for pages and API
3. Static asset embedding via `embed.FS`
4. Basic middleware (logging, session placeholder)
5. Development workflow with live reload

## References

**ADRs:**
- `docs/ADRs/014_offline_pos_technology_stack.md` - Go stack decision

**Design:**
- `docs/ideas/2025-12-09-offline-pos-design.md` - Project structure section

---

## Phase 1: Go Module Initialization

**Prereqs:** Go 1.22+ installed
**Blockers:** None

### 1.1 Create Directory Structure

**Files:**
- CREATE: `apps/offline-pos/`
- CREATE: `apps/offline-pos/go.mod`
- CREATE: `apps/offline-pos/main.go`

**Implementation:**

```bash
mkdir -p apps/offline-pos/{internal/{server,handlers,db,sync,session},templates,static/{js,css}}
cd apps/offline-pos
go mod init github.com/example/offline-pos
```

`go.mod`:
```go
module github.com/example/offline-pos

go 1.22

require (
    modernc.org/sqlite v1.28.0
)
```

### 1.2 Entry Point with Embedded Assets

**Files:**
- CREATE: `apps/offline-pos/main.go`

**Implementation:**

Note: Go's `embed` directive cannot use relative paths that traverse up directories. The embed directives must be in the same package as the embedded files or a parent. We place them in `main.go` at the project root and pass the filesystems to the server.

```go
package main

import (
    "embed"
    "log"
    "os"

    "github.com/example/offline-pos/internal/server"
)

//go:embed templates/*
var templatesFS embed.FS

//go:embed static/*
var staticFS embed.FS

func main() {
    port := os.Getenv("PORT")
    if port == "" {
        port = "3000"
    }

    srv := server.New(port, templatesFS, staticFS)
    log.Printf("Starting Offline POS on :%s", port)
    if err := srv.Run(); err != nil {
        log.Fatal(err)
    }
}
```

---

## Phase 2: HTTP Server Setup

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Server Package

**Files:**
- CREATE: `apps/offline-pos/internal/server/server.go`
- CREATE: `apps/offline-pos/internal/server/routes.go`
- CREATE: `apps/offline-pos/internal/server/middleware.go`

**server.go:**
```go
package server

import (
    "embed"
    "net/http"
)

type Server struct {
    port        string
    router      *http.ServeMux
    templatesFS embed.FS
    staticFS    embed.FS
}

func New(port string, templatesFS, staticFS embed.FS) *Server {
    s := &Server{
        port:        port,
        router:      http.NewServeMux(),
        templatesFS: templatesFS,
        staticFS:    staticFS,
    }
    s.registerRoutes()
    return s
}

func (s *Server) Run() error {
    handler := s.applyMiddleware(s.router)
    return http.ListenAndServe(":"+s.port, handler)
}
```

### 2.2 Route Registration

**routes.go:**
```go
package server

import (
    "io/fs"
    "net/http"

    "github.com/example/offline-pos/internal/handlers"
)

func (s *Server) registerRoutes() {
    // Static assets - strip "static" prefix from embedded FS
    staticContent, _ := fs.Sub(s.staticFS, "static")
    s.router.Handle("GET /static/", http.StripPrefix("/static/",
        http.FileServer(http.FS(staticContent))))

    // Pages
    pages := handlers.NewPageHandlers(s.templatesFS)
    s.router.HandleFunc("GET /", pages.Login)
    s.router.HandleFunc("POST /login", pages.HandleLogin)
    s.router.HandleFunc("GET /scan", pages.Scan)
    s.router.HandleFunc("GET /cart", pages.Cart)
    s.router.HandleFunc("GET /payment", pages.Payment)
    s.router.HandleFunc("GET /complete", pages.Complete)
    s.router.HandleFunc("POST /logout", pages.Logout)

    // API
    api := handlers.NewAPIHandlers()
    s.router.HandleFunc("GET /api/status", api.Status)
    s.router.HandleFunc("GET /api/products/search", api.SearchProducts)
    s.router.HandleFunc("GET /api/products/{upc}", api.GetProduct)
    s.router.HandleFunc("POST /api/cart/add", api.AddToCart)
    s.router.HandleFunc("POST /api/cart/update", api.UpdateCart)
    s.router.HandleFunc("POST /api/cart/remove", api.RemoveFromCart)
    s.router.HandleFunc("GET /api/cart", api.GetCart)
    s.router.HandleFunc("POST /api/transaction/complete", api.CompleteTransaction)
}
```

### 2.3 Middleware

**middleware.go:**
```go
package server

import (
    "log"
    "net/http"
    "time"
)

func (s *Server) applyMiddleware(handler http.Handler) http.Handler {
    return logging(handler)
}

func logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}
```

---

## Phase 3: Handler Stubs

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Page Handlers

**Files:**
- CREATE: `apps/offline-pos/internal/handlers/pages.go`

**Implementation:**

```go
package handlers

import (
    "embed"
    "html/template"
    "net/http"
)

type PageHandlers struct {
    templates *template.Template
}

func NewPageHandlers(fs embed.FS) *PageHandlers {
    tmpl := template.Must(template.ParseFS(fs, "templates/*.html"))
    return &PageHandlers{templates: tmpl}
}

func (h *PageHandlers) Login(w http.ResponseWriter, r *http.Request) {
    h.templates.ExecuteTemplate(w, "login.html", nil)
}

func (h *PageHandlers) HandleLogin(w http.ResponseWriter, r *http.Request) {
    // TODO: Validate PIN, create session
    http.Redirect(w, r, "/scan", http.StatusSeeOther)
}

func (h *PageHandlers) Scan(w http.ResponseWriter, r *http.Request) {
    h.templates.ExecuteTemplate(w, "scan.html", nil)
}

func (h *PageHandlers) Cart(w http.ResponseWriter, r *http.Request) {
    h.templates.ExecuteTemplate(w, "cart.html", nil)
}

func (h *PageHandlers) Payment(w http.ResponseWriter, r *http.Request) {
    h.templates.ExecuteTemplate(w, "payment.html", nil)
}

func (h *PageHandlers) Complete(w http.ResponseWriter, r *http.Request) {
    h.templates.ExecuteTemplate(w, "complete.html", nil)
}

func (h *PageHandlers) Logout(w http.ResponseWriter, r *http.Request) {
    // TODO: Clear session
    http.Redirect(w, r, "/", http.StatusSeeOther)
}
```

### 3.2 API Handlers

**Files:**
- CREATE: `apps/offline-pos/internal/handlers/api.go`

**Implementation:**

```go
package handlers

import (
    "encoding/json"
    "net/http"
)

type APIHandlers struct{}

func NewAPIHandlers() *APIHandlers {
    return &APIHandlers{}
}

func (h *APIHandlers) Status(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(map[string]any{
        "online":              false,
        "pendingTransactions": 0,
    })
}

// Stub implementations - to be completed in 048B
func (h *APIHandlers) SearchProducts(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode([]any{})
}

func (h *APIHandlers) GetProduct(w http.ResponseWriter, r *http.Request) {
    http.NotFound(w, r)
}

func (h *APIHandlers) AddToCart(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
}

func (h *APIHandlers) UpdateCart(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
}

func (h *APIHandlers) RemoveFromCart(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
}

func (h *APIHandlers) GetCart(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(map[string]any{"items": []any{}})
}

func (h *APIHandlers) CompleteTransaction(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
}
```

---

## Phase 4: Placeholder Templates

**Prereqs:** Phase 3 complete
**Blockers:** None

### 4.1 Base Layout and Stub Pages

**Files:**
- CREATE: `apps/offline-pos/templates/layout.html`
- CREATE: `apps/offline-pos/templates/login.html`
- CREATE: `apps/offline-pos/templates/scan.html`
- CREATE: `apps/offline-pos/templates/cart.html`
- CREATE: `apps/offline-pos/templates/payment.html`
- CREATE: `apps/offline-pos/templates/complete.html`

Minimal stubs to verify template loading works. Full implementation in 048D.

---

## Phase 5: Nx Integration

**Prereqs:** All phases complete
**Blockers:** None

### 5.1 Nx Project Configuration

**Files:**
- CREATE: `apps/offline-pos/project.json`

```json
{
  "name": "offline-pos",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/offline-pos",
  "tags": ["type:app", "platform:go"],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "go build -ldflags=\"-s -w\" -o dist/apps/offline-pos/offline-pos .",
        "cwd": "apps/offline-pos"
      },
      "outputs": ["{workspaceRoot}/dist/apps/offline-pos"]
    },
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "command": "go run .",
        "cwd": "apps/offline-pos"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "go test ./...",
        "cwd": "apps/offline-pos"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "go vet ./...",
          "go fmt ./..."
        ],
        "cwd": "apps/offline-pos",
        "parallel": false
      }
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "air",
        "cwd": "apps/offline-pos"
      }
    }
  }
}
```

### 5.2 Air Config (optional live reload)

**Files:**
- CREATE: `apps/offline-pos/.air.toml`

```toml
root = "."
tmp_dir = "tmp"

[build]
cmd = "go build -o ./tmp/main ."
bin = "./tmp/main"
include_ext = ["go", "html", "css", "js"]
exclude_dir = ["tmp", "dist"]
delay = 1000

[log]
time = false

[misc]
clean_on_exit = true
```

### 5.3 Usage

```bash
# Build (production)
pnpm nx build offline-pos

# Run development server
pnpm nx serve offline-pos

# Run with live reload (requires air: go install github.com/air-verse/air@latest)
pnpm nx dev offline-pos

# Run tests
pnpm nx test offline-pos

# Lint
pnpm nx lint offline-pos
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/offline-pos/go.mod` | Go module definition |
| CREATE | `apps/offline-pos/main.go` | Application entry point with embedded assets |
| CREATE | `apps/offline-pos/project.json` | Nx project configuration |
| CREATE | `apps/offline-pos/internal/server/server.go` | HTTP server |
| CREATE | `apps/offline-pos/internal/server/routes.go` | Route registration |
| CREATE | `apps/offline-pos/internal/server/middleware.go` | Logging middleware |
| CREATE | `apps/offline-pos/internal/handlers/pages.go` | HTML page handlers |
| CREATE | `apps/offline-pos/internal/handlers/api.go` | JSON API handlers |
| CREATE | `apps/offline-pos/templates/*.html` | HTML template stubs |
| CREATE | `apps/offline-pos/.air.toml` | Live reload config (optional) |

## Testing Strategy

```bash
# Verify build
pnpm nx build offline-pos

# Verify server starts
pnpm nx serve offline-pos &
sleep 2
curl http://localhost:3000/
curl http://localhost:3000/api/status

# Verify static serving
curl http://localhost:3000/static/css/styles.css

# Run Go tests
pnpm nx test offline-pos
```

## Checklist

- [ ] Go module initialized
- [ ] Nx project.json configured
- [ ] HTTP server starts on :3000 (`pnpm nx serve offline-pos`)
- [ ] All page routes return HTML
- [ ] All API routes return JSON
- [ ] Static assets served correctly
- [ ] Build produces binary in dist/ (`pnpm nx build offline-pos`)
