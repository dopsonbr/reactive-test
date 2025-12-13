# 060A: Faro Infrastructure

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Parent Plan:** [060_FRONTEND_OBSERVABILITY_FARO.md](060_FRONTEND_OBSERVABILITY_FARO.md)

**Goal:** Deploy Grafana Alloy with Faro receiver to accept frontend telemetry and route to Loki/Tempo.

---

## Task 1: Create Alloy Configuration

**Files:**
- Create: `docker/alloy/config.alloy`

**Step 1: Create the Alloy config file**

```hcl
// docker/alloy/config.alloy
// Grafana Alloy configuration for Faro frontend observability

logging {
  level = "info"
}

// ============================================================================
// Faro Receiver - Accepts browser telemetry from frontend apps
// ============================================================================

faro.receiver "frontend" {
  server {
    listen_address = "0.0.0.0"
    listen_port    = 12347

    cors_allowed_origins = [
      "http://localhost:*",
      "http://127.0.0.1:*",
      "http://localhost:3001",   // ecommerce-web
      "http://localhost:3002",   // kiosk-web
      "http://localhost:3004",   // pos-web
      "http://localhost:3010",   // merchant-portal
      "http://localhost:4200",   // Vite dev server
      "http://localhost:5173",   // Vite dev server alt
    ]
  }

  output {
    logs   = [loki.write.default.receiver]
    traces = [otelcol.exporter.otlp.tempo.input]
  }
}

// ============================================================================
// Loki Writer - Send logs to Loki
// ============================================================================

loki.write "default" {
  endpoint {
    url = "http://loki:3100/loki/api/v1/push"
  }
}

// ============================================================================
// Tempo Exporter - Send traces to Tempo via OTLP
// ============================================================================

otelcol.exporter.otlp "tempo" {
  client {
    endpoint = "tempo:4317"
    tls {
      insecure = true
    }
  }
}
```

**Step 2: Verify file created**

Run: `cat docker/alloy/config.alloy | head -20`
Expected: Shows logging and faro.receiver configuration

**Step 3: Commit**

```bash
git add docker/alloy/config.alloy
git commit -m "chore(docker): add Alloy config for Faro receiver"
```

---

## Task 2: Add Alloy Service to Docker Compose

**Files:**
- Modify: `docker/docker-compose.yml`

**Step 1: Add Alloy service after promtail service**

Find the `promtail:` service block and add the following after it:

```yaml
  alloy:
    image: grafana/alloy:v1.5.1
    container_name: alloy
    command: ["run", "/etc/alloy/config.alloy", "--server.http.listen-addr=0.0.0.0:12345"]
    volumes:
      - ./alloy/config.alloy:/etc/alloy/config.alloy:ro
    ports:
      - "12345:12345"   # Alloy UI
      - "12347:12347"   # Faro receiver
    depends_on:
      loki:
        condition: service_healthy
      tempo:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:12345/ready"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - observability
```

**Step 2: Verify docker-compose syntax**

Run: `docker compose -f docker/docker-compose.yml config --quiet && echo "Valid"`
Expected: `Valid`

**Step 3: Commit**

```bash
git add docker/docker-compose.yml
git commit -m "chore(docker): add Grafana Alloy service for frontend observability"
```

---

## Task 3: Test Alloy Deployment

**Step 1: Start Alloy with dependencies**

Run: `docker compose -f docker/docker-compose.yml up -d loki tempo alloy`
Expected: All 3 services start successfully

**Step 2: Verify Alloy is healthy**

Run: `docker compose -f docker/docker-compose.yml ps alloy`
Expected: Status shows "healthy"

**Step 3: Verify Alloy UI accessible**

Run: `curl -s http://localhost:12345/ready`
Expected: `Ready`

**Step 4: Test Faro receiver endpoint**

Run:
```bash
curl -X POST http://localhost:12347/collect \
  -H "Content-Type: application/json" \
  -d '{"logs":[{"message":"test from curl","level":"info","timestamp":"2025-01-01T00:00:00Z"}],"meta":{"app":{"name":"test-app","version":"1.0.0"}}}'
```
Expected: HTTP 202 or 204 (accepted)

**Step 5: Verify log reached Loki**

Run: `curl -s 'http://localhost:3100/loki/api/v1/query?query={app="test-app"}' | jq '.data.result'`
Expected: Array with at least one stream containing "test from curl"

---

## Summary

| Task | Files | Commit |
|------|-------|--------|
| 1 | `docker/alloy/config.alloy` | Alloy config for Faro receiver |
| 2 | `docker/docker-compose.yml` | Add Alloy service |
| 3 | - | Verification only |

**Next:** [060B_FARO_SHARED_LIBRARY.md](060B_FARO_SHARED_LIBRARY.md)
