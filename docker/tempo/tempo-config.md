# tempo-config.yml

## Purpose

Configures Grafana Tempo as the distributed tracing backend. Tempo receives OpenTelemetry traces from the application and stores them for querying via Grafana.

## Key Configuration

### Server

| Setting | Value | Purpose |
|---------|-------|---------|
| `http_listen_port` | 3200 | HTTP API for trace queries |

### Trace Receivers (Distributor)

| Protocol | Port | Purpose |
|----------|------|---------|
| OTLP gRPC | 4317 | Primary trace ingestion (used by the app) |
| OTLP HTTP | 4318 | Alternative HTTP-based ingestion |

The application sends traces via OTLP gRPC to `tempo:4317`.

### Storage

| Setting | Value | Purpose |
|---------|-------|---------|
| `backend` | local | Filesystem-based storage (local dev) |
| `trace.path` | /var/tempo/traces | Where trace data is stored |
| `wal.path` | /var/tempo/wal | Write-ahead log for durability |

### Metrics Generator

| Setting | Value | Purpose |
|---------|-------|---------|
| `processors` | service-graphs, span-metrics | Derives metrics from trace data |
| `external_labels.source` | tempo | Labels generated metrics |

**Generated metrics include:**
- Service dependency graphs (which services call which)
- Span duration histograms
- Request rates per service

## Why These Settings

- **OTLP receivers:** Industry-standard OpenTelemetry protocol, used by Spring Boot's OTEL agent
- **Local storage:** Simple single-node setup for development (production would use object storage)
- **Metrics generator:** Enables RED metrics (Rate, Errors, Duration) derived directly from traces
- **Service graphs:** Automatically maps service dependencies for visualization

## Integration Points

- **Application** sends traces to `tempo:4317` (OTLP gRPC)
- **Grafana** queries traces via `tempo:3200`
- **Loki** receives trace-to-log correlation via shared `traceId`
- **Prometheus** receives derived metrics from the metrics generator
