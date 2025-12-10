# 048_OFFLINE_POS

**Status: DRAFT**

---

## Overview

Implement the Offline POS application - a disaster recovery point-of-sale system that runs as a single Go binary with SQLite storage and vanilla JavaScript frontend. The app captures sales when primary systems are unavailable and syncs transactions when connectivity returns.

**Related Plans:**
- 048A_OFFLINE_POS_GO_INFRASTRUCTURE - Go project setup, HTTP server, templates
- 048B_OFFLINE_POS_DATABASE - SQLite schema, migrations, queries
- 048C_OFFLINE_POS_SYNC - Background sync service for products and transactions
- 048D_OFFLINE_POS_UI - HTML pages, vanilla JS modules, CSS styling
- 048E_OFFLINE_POS_PERIPHERAL - WebSocket client for scanner/payment/printer

## Goals

1. Single Go binary deployment (~15-20MB) with embedded assets
2. SQLite database for offline product catalog and transaction storage
3. Multi-page HTML UI served from localhost (instant page loads)
4. Vanilla JavaScript with native ESM (no build step)
5. Background sync: products down, transactions up when online
6. Peripheral bridge integration for scanner, payment, and printer

## References

**ADRs:**
- `docs/ADRs/013_offline_data_store.md` - SQLite chosen for offline storage
- `docs/ADRs/014_offline_pos_technology_stack.md` - Go + vanilla ESM stack

**Design Documents:**
- `docs/ideas/2025-12-09-offline-pos-design.md` - Full application design
- `docs/ideas/2025-12-07-peripheral-integration-design.md` - Device integration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Offline POS Binary (Go)                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HTTP Server (:3000)                                │   │
│  │  ├── GET /           → login.html                   │   │
│  │  ├── GET /scan       → scan.html                    │   │
│  │  ├── GET /cart       → cart.html                    │   │
│  │  ├── GET /payment    → payment.html                 │   │
│  │  ├── GET /complete   → complete.html                │   │
│  │  ├── /api/*          → JSON API handlers            │   │
│  │  └── /static/*       → embed.FS (JS, CSS)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │  SQLite (WAL)   │  │  Background Sync                │  │
│  │  - products     │  │  - Product catalog refresh      │  │
│  │  - operators    │  │  - Transaction upload           │  │
│  │  - transactions │  │  - Connectivity detection       │  │
│  │  - sync_status  │  │                                 │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                              │
         │ HTTP :3000                   │ HTTPS (when online)
         ▼                              ▼
┌─────────────────┐            ┌─────────────────┐
│  Browser        │            │  Central        │
│  - HTML pages   │            │  Systems        │
│  - Vanilla JS   │            │                 │
│  - WebSocket ───┼──────┐     └─────────────────┘
└─────────────────┘      │
                         ▼
              ┌─────────────────┐
              │ Peripheral      │
              │ Bridge :9100    │
              └─────────────────┘
```

### Project Structure

```
apps/offline-pos/
├── main.go                     # Entry point
├── go.mod
├── internal/
│   ├── server/                 # HTTP server setup
│   ├── handlers/               # Page + API handlers
│   ├── db/                     # SQLite queries
│   ├── sync/                   # Background sync
│   └── session/                # Cookie sessions
├── templates/                  # Go html/template
├── static/                     # Embedded JS/CSS
├── Dockerfile
└── README.md
```

### Dependency Order

```
                    048A (Go Infrastructure)
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
         048B (DB)    048D (UI)    048E (Peripheral)
              │             │             │
              └──────┬──────┴─────────────┘
                     │
                     ▼
               048C (Sync)
                     │
                     ▼
              Integration Testing
```

- **048A** must complete first (creates project structure)
- **048B, 048D, 048E** can run in parallel after 048A
- **048C** depends on 048B (needs database layer)
- Integration testing after all sub-plans complete

## Sub-Plan Summary

| Plan | Focus | LOE | Dependencies |
|------|-------|-----|--------------|
| 048A | Go project, HTTP server, routing | 1 day | None |
| 048B | SQLite schema, migrations, queries | 1 day | 048A |
| 048C | Background sync service | 1 day | 048A, 048B |
| 048D | HTML templates, vanilla JS, CSS | 2 days | 048A |
| 048E | Peripheral WebSocket client | 1 day | 048A, 048D |

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/offline-pos/` | New Go application directory |
| CREATE | `apps/offline-pos/main.go` | Application entry point |
| CREATE | `apps/offline-pos/go.mod` | Go module definition |
| CREATE | `apps/offline-pos/internal/` | Internal packages |
| CREATE | `apps/offline-pos/templates/` | HTML templates |
| CREATE | `apps/offline-pos/static/` | JS/CSS assets |
| CREATE | `apps/offline-pos/Dockerfile` | Container build |
| MODIFY | `CLAUDE.md` | Add offline-pos to project structure |

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add offline-pos to Applications table, Go commands |
| `apps/offline-pos/README.md` | Application documentation |
| `apps/offline-pos/AGENTS.md` | AI agent guidance for Go patterns |

## Checklist

- [ ] 048A: Go infrastructure complete
- [ ] 048B: Database layer complete
- [ ] 048C: Sync service complete
- [ ] 048D: UI layer complete
- [ ] 048E: Peripheral integration complete
- [ ] Integration testing passing
- [ ] Documentation updated
- [ ] Docker build working
