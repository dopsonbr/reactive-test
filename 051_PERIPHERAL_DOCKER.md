# 051_PERIPHERAL_DOCKER

**Status: DRAFT**

---

## Overview

Dockerize the peripheral-emulator Go application and integrate it into the platform's Docker Compose stack and powerstart script. This enables consistent local development with device emulation and prepares for CI/CD integration testing.

**Related Plans:**
- `049_PERIPHERAL_DEVELOPER_TOOLKIT` - Original peripheral toolkit implementation (completed)

## Goals

1. Create multi-stage Dockerfile for peripheral-emulator (Go binary)
2. Add peripheral-emulator service to docker-compose.yml
3. Integrate peripheral-emulator into powerstart startup flow
4. Register ports 9100/9101 in port conflict checking

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Docker Compose Stack                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ peripheral-      │  │ kiosk-web        │  │ ecommerce-web │  │
│  │ emulator         │  │ (local/Docker)   │  │ (Docker)      │  │
│  │ :9100 WS         │  │ :3002            │  │ :3001         │  │
│  │ :9101 HTTP       │  │                  │  │               │  │
│  └────────┬─────────┘  └────────┬─────────┘  └───────────────┘  │
│           │                     │                                │
│           │  STOMP/WebSocket    │                                │
│           └─────────────────────┘                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │             Backend Services (8081-8090)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Dependency Order

```
Infrastructure (postgres, redis, wiremock)
              │
              ▼
    Observability Stack
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
  peripheral-   Backend Services
  emulator      (8081-8090)
       │             │
       └──────┬──────┘
              ▼
      Frontend Apps
   (ecommerce, kiosk)
```

Peripheral-emulator can start in parallel with backend services (no dependencies between them).

---

## Phase 1: Create Dockerfile for Peripheral Emulator

**Prereqs:**
- Go app exists at `apps/peripheral-emulator/`
- Go modules configured (`go.mod`, `go.sum`)

**Blockers:** None

### 1.1 Create Multi-Stage Dockerfile

**Files:**
- CREATE: `docker/Dockerfile.peripheral-emulator`

**Implementation:**

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /build

# Copy go modules first for caching
COPY apps/peripheral-emulator/go.mod apps/peripheral-emulator/go.sum ./
RUN go mod download

# Copy source and build
COPY apps/peripheral-emulator/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o peripheral-emulator ./cmd/emulator

# Runtime stage
FROM alpine:3.20

RUN apk add --no-cache ca-certificates curl

WORKDIR /app
COPY --from=builder /build/peripheral-emulator .

# WebSocket port and HTTP control port
EXPOSE 9100 9101

# Health check via HTTP control endpoint
HEALTHCHECK --interval=5s --timeout=3s --retries=10 \
  CMD curl -f http://localhost:9101/control/state || exit 1

ENTRYPOINT ["./peripheral-emulator"]
CMD ["--port-ws=9100", "--port-http=9101", "--device-id=emulator-001"]
```

---

## Phase 2: Add Service to Docker Compose

**Prereqs:**
- Dockerfile.peripheral-emulator exists (Phase 1)

**Blockers:** None

### 2.1 Add peripheral-emulator Service

**Files:**
- MODIFY: `docker/docker-compose.yml`

**Implementation:**

Add after the frontend services section:

```yaml
  # === Peripheral Device Emulator ===
  peripheral-emulator:
    build:
      context: ..
      dockerfile: docker/Dockerfile.peripheral-emulator
    container_name: peripheral-emulator
    environment:
      - WEBSOCKET_PORT=9100
      - HTTP_PORT=9101
      - DEVICE_ID=emulator-001
      - PAYMENT_DECLINE_RATE=0.1
      - PAYMENT_AUTH_DELAY_MS=2000
    ports:
      - "9100:9100"   # WebSocket/STOMP
      - "9101:9101"   # HTTP Control + Dashboard
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9101/control/state"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - observability
```

---

## Phase 3: Integrate with Powerstart

**Prereqs:**
- docker-compose.yml updated (Phase 2)

**Blockers:** None

### 3.1 Add to ALL_APPS Registry

**Files:**
- MODIFY: `powerstart`

**Implementation:**

Add to `ALL_APPS` object (around line 24):

```javascript
const ALL_APPS = {
  // Backend services (Docker)
  'product-service': { port: 8090, type: 'backend', docker: 'product-service' },
  // ... existing services ...

  // Peripheral emulator (Docker)
  'peripheral-emulator': { port: 9100, type: 'emulator', docker: 'peripheral-emulator', httpPort: 9101 },

  // Frontend apps
  // ... existing ...
};
```

### 3.2 Add Ports to Conflict Checking

**Files:**
- MODIFY: `powerstart`

**Implementation:**

Add to ports array in `checkPortConflicts()` (around line 212):

```javascript
const ports = [
  // ... existing ports ...
  { port: 9100, service: 'peripheral-emulator (WebSocket)' },
  { port: 9101, service: 'peripheral-emulator (HTTP)' },
];
```

### 3.3 Add Emulator Startup Function

**Files:**
- MODIFY: `powerstart`

**Implementation:**

Add new function after `startBackendServices()`:

```javascript
// Start peripheral emulator
async function startPeripheralEmulator() {
  logHeader('Starting Peripheral Emulator');

  if (alreadyRunning.has('peripheral-emulator (WebSocket)')) {
    logSuccess('peripheral-emulator already running');
    startedServices.push('peripheral-emulator:9100', 'peripheral-emulator-http:9101');
    return;
  }

  logStep('Starting peripheral-emulator...');
  exec('docker compose up -d peripheral-emulator', { cwd: DOCKER_DIR, silent: true, ignoreError: true });

  logStep('Waiting for peripheral-emulator to be healthy...');
  if (await waitForHealth('peripheral-emulator', 9101, '/control/state')) {
    startedServices.push('peripheral-emulator:9100', 'peripheral-emulator-http:9101');
  } else {
    failedServices.push('peripheral-emulator');
  }
}
```

### 3.4 Update Main Startup Flow

**Files:**
- MODIFY: `powerstart`

**Implementation:**

Update `main()` to call emulator startup (around line 946):

```javascript
// Default: start everything
printBanner();
checkPrerequisites();
await checkPortConflicts();
buildJars();
await startInfrastructure();
await startObservability();
await startPeripheralEmulator();  // Add this line
await startBackendServices();
await startFrontend();
printSummary();
```

### 3.5 Update Summary Output

**Files:**
- MODIFY: `powerstart`

**Implementation:**

Add to `printSummary()` after Backend Services section:

```javascript
// Peripheral Devices
console.log(`${colors.bold}Peripheral Devices:${colors.nc}`);
console.log(`  ${colors.cyan}peripheral-emulator${colors.nc}`);
console.log(`                     WebSocket: ws://localhost:9100/stomp`);
console.log(`                     Dashboard: http://localhost:9101`);
console.log('');
```

### 3.6 Support Rebuild for Emulator

**Files:**
- MODIFY: `powerstart`

**Implementation:**

Add new function for rebuilding emulator:

```javascript
// Rebuild and restart peripheral emulator
async function rebuildEmulatorApp(appName) {
  const app = ALL_APPS[appName];
  if (!app || app.type !== 'emulator') {
    logError(`${appName} is not a valid emulator app`);
    return false;
  }

  logHeader(`Rebuilding ${appName}`);

  // Stop the container
  logStep(`Stopping ${appName} container...`);
  exec(`docker compose stop ${app.docker}`, { cwd: DOCKER_DIR, silent: true, ignoreError: true });
  exec(`docker compose rm -f ${app.docker}`, { cwd: DOCKER_DIR, silent: true, ignoreError: true });
  logSuccess(`${appName} container stopped`);

  // Rebuild and start (Go build happens in Docker)
  logStep(`Rebuilding and starting ${appName} container...`);
  exec(`docker compose build --no-cache ${app.docker}`, { cwd: DOCKER_DIR, silent: true, ignoreError: true });
  exec(`docker compose up -d ${app.docker}`, { cwd: DOCKER_DIR, silent: true, ignoreError: true });

  // Wait for health
  logStep(`Waiting for ${appName} to be healthy...`);
  if (await waitForHealth(appName, app.httpPort, '/control/state')) {
    logSuccess(`${appName} is ready`);
    logInfo(`  WebSocket: ws://localhost:${app.port}/stomp`);
    logInfo(`  Dashboard: http://localhost:${app.httpPort}`);
    return true;
  } else {
    logError(`${appName} failed to become healthy`);
    return false;
  }
}
```

Update `rebuildApp()` to handle emulator type:

```javascript
async function rebuildApp(appName) {
  const app = ALL_APPS[appName];
  if (!app) {
    logError(`Unknown app: ${appName}`);
    logInfo(`Available apps: ${Object.keys(ALL_APPS).join(', ')}`);
    return false;
  }

  if (app.type === 'backend') {
    return await rebuildBackendApp(appName);
  } else if (app.type === 'emulator') {
    return await rebuildEmulatorApp(appName);
  } else {
    return await rebuildFrontendApp(appName);
  }
}
```

---

## Phase 4: Update Port Registry and Documentation

**Prereqs:** All previous phases complete

**Blockers:** None

### 4.1 Update Port Checking Tool

**Files:**
- MODIFY: `tools/check-service-ports.mjs`

**Implementation:**

Add peripheral-emulator ports to the registry.

### 4.2 Update Help Output

**Files:**
- MODIFY: `powerstart`

**Implementation:**

Update `showHelp()` to include emulator in available apps:

```javascript
${colors.bold}Available apps:${colors.nc}
  ${colors.cyan}Backend:${colors.nc}
    product-service, cart-service, ...

  ${colors.cyan}Emulators:${colors.nc}
    peripheral-emulator

  ${colors.cyan}Frontend:${colors.nc}
    ecommerce-web, kiosk-web, home-portal
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `docker/Dockerfile.peripheral-emulator` | Multi-stage Go build for emulator |
| MODIFY | `docker/docker-compose.yml` | Add peripheral-emulator service |
| MODIFY | `powerstart` | Add emulator to startup flow |
| MODIFY | `tools/check-service-ports.mjs` | Register ports 9100/9101 |

---

## Testing Strategy

1. **Build Test**: `docker compose build peripheral-emulator` succeeds
2. **Startup Test**: `docker compose up -d peripheral-emulator` starts and health check passes
3. **Integration Test**:
   - WebSocket connection to `ws://localhost:9100/stomp` succeeds
   - HTTP GET to `http://localhost:9101/control/state` returns valid JSON
   - Dashboard accessible at `http://localhost:9101`
4. **Powerstart Test**: `./powerstart` includes emulator in startup flow
5. **Rebuild Test**: `./powerstart -r peripheral-emulator` rebuilds and restarts emulator

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add peripheral-emulator to Canonical Service Ports table |
| `README.md` | Add emulator to Quick Start docker commands |
| `apps/peripheral-emulator/README.md` | Add Docker usage section |

---

## Checklist

- [ ] Phase 1: Dockerfile created and builds successfully
- [ ] Phase 2: docker-compose.yml updated, service starts
- [ ] Phase 3: powerstart integration complete
- [ ] Phase 4: Port registry and docs updated
- [ ] All health checks passing
- [ ] `./powerstart` includes emulator in output
- [ ] `./powerstart -r peripheral-emulator` works
- [ ] Documentation updated
