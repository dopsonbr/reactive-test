# Dockerize Application with Grafana Observability Stack

## Overview

This project dockerizes the Spring Boot WebFlux application and adds the full Grafana observability stack (Loki, Prometheus, Tempo, Grafana) with OpenTelemetry distributed tracing.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Grafana (3000)                              │
│                         Dashboards & Explore                             │
└─────────────┬───────────────────┬───────────────────┬───────────────────┘
              │                   │                   │
     ┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
     │   Prometheus    │ │      Loki       │ │      Tempo      │
     │   (Metrics)     │ │     (Logs)      │ │    (Traces)     │
     │     :9090       │ │     :3100       │ │     :3200       │
     └────────▲────────┘ └────────▲────────┘ └────────▲────────┘
              │                   │                   │
         scrape              push (promtail)     OTLP gRPC
              │                   │                   │
     ┌────────┴───────────────────┴───────────────────┴────────┐
     │                    reactive-test (8080)                  │
     │              Spring Boot + OTEL Java Agent               │
     └────────────────────────┬────────────────────────────────┘
                              │
                     ┌────────▼────────┐
                     │    WireMock     │
                     │  (Mock APIs)    │
                     │     :8081       │
                     └─────────────────┘

     ┌─────────────────┐
     │       k6        │ ──────▶ reactive-test:8080
     │  (Load Test)    │
     └─────────────────┘
```

## Quick Start

```bash
# Start the observability stack
cd docker
docker compose up -d

# Wait for services to be healthy, then run load test
docker compose --profile test up k6

# Access services
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
# Tempo: http://localhost:3200
# Loki: http://localhost:3100
# App: http://localhost:8080/products/123456

# Stop everything
docker compose --profile test down -v
```

## Files Created

### Docker Infrastructure (`docker/`)

| File | Purpose |
|------|---------|
| `docker/Dockerfile` | Single-stage runtime build (pre-built JAR) with OTEL agent |
| `docker/docker-compose.yml` | Full stack orchestration |
| `docker/tempo/tempo-config.yml` | Tempo trace storage |
| `docker/loki/loki-config.yml` | Loki log aggregation |
| `docker/promtail/promtail-config.yml` | Ship logs to Loki |
| `docker/prometheus/prometheus.yml` | Metrics scraping |
| `docker/grafana/provisioning/datasources/datasources.yml` | Auto-configure datasources |
| `docker/grafana/provisioning/dashboards/dashboards.yml` | Dashboard provisioning |
| `docker/grafana/provisioning/dashboards/reactive-test.json` | Pre-built dashboard |
| `docker/grafana/provisioning/dashboards/spring-boot-observability.json` | Community Spring Boot dashboard |

### Application Config

| File | Purpose |
|------|---------|
| `src/main/resources/application-docker.properties` | Docker-specific config (service URLs, actuator) |

## Files Modified

| File | Changes |
|------|---------|
| `build.gradle` | Added `io.opentelemetry:opentelemetry-api` for trace context access |
| `src/main/java/.../logging/LogEntry.java` | Added `traceId` and `spanId` fields |
| `src/main/java/.../logging/StructuredLogger.java` | Extract trace context from OTEL span |
| `src/main/resources/logback-spring.xml` | Added trace IDs to console output pattern, JSON stdout for Docker |
| `perf-test/k6/load-test.js` | Use `BASE_URL` env var instead of hardcoded localhost |
| `.dockerignore` | Exclude build artifacts except `build/libs/` for JAR |
| `README.md` | Added Docker Compose instructions and observability documentation |

## Services

| Service | Image | Ports | Description |
|---------|-------|-------|-------------|
| wiremock | wiremock/wiremock:3.10.0 | 8081 | Mock external services |
| tempo | grafana/tempo:2.6.1 | 3200, 4317 | Distributed tracing |
| loki | grafana/loki:3.3.2 | 3100 | Log aggregation |
| prometheus | prom/prometheus:v2.55.1 | 9090 | Metrics |
| grafana | grafana/grafana:11.4.0 | 3000 | Visualization |
| promtail | grafana/promtail:3.3.2 | - | Log shipping |
| reactive-test | (build) | 8080 | Spring Boot app |
| k6 | grafana/k6:0.55.0 | - | Load testing (profile: test) |

## Grafana Features

1. **Logs → Traces**: Click trace ID in Loki to jump to Tempo trace
2. **Traces → Logs**: View related logs for any trace in Tempo
3. **Metrics → Traces**: Exemplars link Prometheus metrics to traces
4. **Service Map**: Visualize request flow between services
5. **Pre-built Dashboard**: Request rate, latency percentiles, error rate, log stream
6. **k6 Metrics in Prometheus**: Load test metrics (VUs, iterations, latency, errors) sent via remote-write

## OpenTelemetry Configuration

The application uses the OpenTelemetry Java Agent for automatic instrumentation:

- **Agent**: Downloaded at build time (v2.10.0)
- **Traces**: Sent to Tempo via OTLP gRPC (port 4317)
- **Trace Context**: Extracted in `StructuredLogger` and included in JSON logs
- **MDC Integration**: OTEL agent injects `trace_id` and `span_id` into Logback MDC

## Log Format

Logs are structured JSON with trace correlation:

```json
{
  "level": "info",
  "logger": "productscontroller",
  "traceId": "abc123...",
  "spanId": "def456...",
  "metadata": {
    "storeNumber": 1234,
    "orderNumber": "uuid",
    "userId": "user123",
    "sessionId": "session-uuid"
  },
  "data": { "type": "request|response|message", ... }
}
```

---

## Implementation Status

### All Tasks Completed ✓

- [x] Create `docker/` directory structure
- [x] Create `docker/Dockerfile` (single-stage with pre-built JAR and OTEL agent)
- [x] Create `docker/docker-compose.yml` (8 services)
- [x] Create `docker/tempo/tempo-config.yml`
- [x] Create `docker/loki/loki-config.yml`
- [x] Create `docker/promtail/promtail-config.yml`
- [x] Create `docker/prometheus/prometheus.yml`
- [x] Create `docker/grafana/provisioning/datasources/datasources.yml`
- [x] Create `docker/grafana/provisioning/dashboards/dashboards.yml`
- [x] Create `docker/grafana/provisioning/dashboards/reactive-test.json`
- [x] Create `docker/grafana/provisioning/dashboards/spring-boot-observability.json`
- [x] Create `src/main/resources/application-docker.properties`
- [x] Update `build.gradle` with OpenTelemetry API dependency
- [x] Update `LogEntry.java` with traceId/spanId fields
- [x] Update `StructuredLogger.java` for trace context extraction
- [x] Update `logback-spring.xml` with trace IDs and JSON stdout for Docker
- [x] Update `perf-test/k6/load-test.js` to use BASE_URL env var
- [x] Create `.dockerignore` file
- [x] Update `README.md` with Docker Compose instructions
- [x] Verify Java compilation succeeds
- [x] Build Docker image
- [x] Start observability stack
- [x] Run load test (10k requests, 100% success rate, ~140 req/s)
- [x] Verify traces in Tempo
- [x] Verify logs in Loki with trace correlation
- [x] Verify metrics in Prometheus
- [x] Test Grafana dashboards

## Test Results

**Load Test Summary (k6):**
- 10,000 requests completed
- 100% success rate (0 failures)
- ~140 requests/second throughput
- Average latency: 354ms
- P95 latency: 391ms

**Observability Verification:**
- Traces captured in Tempo with 4 spans per request (main + 3 parallel repo calls)
- Logs in Loki with `traceId` and `spanId` correlation
- Metrics in Prometheus including HTTP server metrics and k6 load test metrics
- Grafana dashboards provisioned with datasource links
