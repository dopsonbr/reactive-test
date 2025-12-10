# Go and Vanilla ESM for Offline POS Application

* Status: accepted
* Deciders: Platform Team
* Date: 2025-12-09

## Context and Problem Statement

The Offline POS application needs a technology stack for both the server (data sync, HTTP serving, business logic) and the browser UI. The application runs entirely on local hardware in retail stores, serving pages and APIs from localhost. The stack must prioritize reliability over developer convenience - this is a disaster recovery system that must work when primary systems fail.

## Decision Drivers

1. **Single binary deployment** - Minimize moving parts for retail hardware
2. **Minimal runtime dependencies** - No Node.js, Python, or JVM on target devices
3. **Offline operation** - No CDN dependencies, all assets served locally
4. **Low resource footprint** - Share commodity hardware with other POS apps
5. **Localhost serving** - Network latency is not a factor for UI decisions
6. **Maintainability** - Code should be simple enough to debug in crisis situations

## Considered Options

1. Go backend + Vanilla JavaScript ESM (chosen)
2. Go backend + Node.js frontend (htmx + EJS)
3. Node.js backend + React SPA
4. Rust backend + Vanilla JavaScript

## Decision Outcome

Chosen option: **Go backend + Vanilla JavaScript ESM**

A single Go binary handles all server responsibilities: HTTP serving, REST API, HTML templating, SQLite access, and background sync. The browser UI uses vanilla JavaScript with native ES modules - no framework, no bundler, no build step.

This architecture leverages a key insight: **localhost serving eliminates the performance argument for SPAs**. Full page loads from localhost take ~1-2ms, making traditional multi-page applications perfectly responsive. The rigid 5-screen flow (login → scan → cart → payment → complete) doesn't benefit from SPA complexity.

The ~200 lines of JavaScript needed (peripheral WebSocket, fetch calls, status polling) don't justify React, htmx, or any framework. Native browser APIs (`fetch`, `WebSocket`, ES modules) cover all requirements.

### Positive Consequences

- Single runtime (Go) simplifies deployment and operations
- Single binary (~15-20MB) includes all assets via `embed.FS`
- No build tooling - JavaScript source is production code
- ~30MB memory footprint vs ~100MB+ with Node.js
- Fewer failure modes - one process to monitor
- Browser-native ESM supported by all modern browsers (94%+)

### Negative Consequences

- Team needs Go proficiency for full-stack changes
- No hot module reload - requires page refresh during development
- Go templating less ergonomic than JSX/EJS for complex UIs
- Limited ecosystem compared to npm (acceptable given minimal JS needs)

## Pros and Cons of the Options

### 1. Go backend + Vanilla JavaScript ESM (chosen)

**Good**
- Single binary deployment
- Zero runtime dependencies
- ~30MB memory footprint
- No build step for JavaScript
- Native ES modules work in all browsers
- Go's excellent SQLite support (`modernc.org/sqlite`)
- Strong typing and compile-time error checking

**Bad**
- Go templating is verbose compared to JSX
- No hot reload without additional tooling (e.g., `air`)
- Less frontend library ecosystem access
- Team primarily familiar with Java/TypeScript

### 2. Go backend + Node.js frontend (htmx + EJS)

**Good**
- htmx simplifies partial page updates
- EJS templating is familiar to JavaScript developers
- Node.js has excellent WebSocket libraries
- Could share code with existing frontend team

**Bad**
- Two runtimes to deploy and monitor (Go + Node.js)
- ~100MB+ memory footprint
- Additional process coordination complexity
- Two points of failure instead of one
- htmx is another dependency (albeit small)

### 3. Node.js backend + React SPA

**Good**
- Consistent with ecommerce-web frontend stack
- Rich ecosystem of React components
- Team familiarity with React patterns
- Hot module reload during development

**Bad**
- Requires bundler (Vite, Webpack) for production
- SPA complexity unnecessary for linear 5-screen flow
- Larger JavaScript bundle to serve
- Node.js runtime required on device
- Build step adds deployment complexity

### 4. Rust backend + Vanilla JavaScript

**Good**
- Smallest possible binary and memory footprint
- Excellent performance
- Strong safety guarantees

**Bad**
- Significant learning curve for team
- Slower development velocity
- Smaller ecosystem for web serving
- Overkill for this use case

## Implementation Notes and Next Steps

### Go Binary Structure

```
apps/offline-pos/
├── main.go
├── internal/
│   ├── server/      # HTTP server, routes
│   ├── handlers/    # Page and API handlers
│   ├── db/          # SQLite queries
│   └── sync/        # Background sync
├── templates/       # Go html/template files
└── static/          # Embedded via embed.FS
    ├── js/          # ESM modules
    └── css/
```

### JavaScript Modules (Vanilla ESM)

```javascript
// static/js/peripheral.js
export function connectPeripherals(url) {
  const ws = new WebSocket(url);
  // ... WebSocket handling
}

// Used in HTML:
// <script type="module">
//   import { connectPeripherals } from '/static/js/peripheral.js';
// </script>
```

### Development Workflow

```bash
# Run with live reload
air

# Or simple rebuild
go build -o offline-pos . && ./offline-pos

# Production build
go build -ldflags="-s -w" -o offline-pos .
```

## References

- [Offline POS Design](../ideas/2025-12-09-offline-pos-design.md) - Full application design
- [ADR-013: SQLite as Offline Data Store](013_offline_data_store.md) - Database decision
- [JavaScript Modules in 2025](https://siddsr0015.medium.com/javascript-modules-in-2025-esm-import-maps-best-practices-7b6996fa8ea3)
- [Why Vanilla JavaScript is Making a Comeback](https://dev.to/arkhan/why-vanilla-javascript-is-making-a-comeback-in-2025-4939)
- [Go embed.FS Documentation](https://pkg.go.dev/embed)
