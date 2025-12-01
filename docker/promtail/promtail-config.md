# promtail-config.yml

## Purpose

Configures Promtail to collect application logs and ship them to Loki. Promtail tails log files, parses JSON logs, extracts fields, and adds structured metadata for trace correlation.

## Key Configuration

### Server

| Setting | Value | Purpose |
|---------|-------|---------|
| `http_listen_port` | 9080 | Promtail's own metrics/health endpoint |
| `grpc_listen_port` | 0 | Disabled (not needed) |

### Client

| Setting | Value | Purpose |
|---------|-------|---------|
| `url` | http://loki:3100/loki/api/v1/push | Where to send logs |

### Positions

| Setting | Value | Purpose |
|---------|-------|---------|
| `filename` | /tmp/positions.yaml | Tracks read position in log files |

## Log Processing Pipeline

### 1. File Discovery

```yaml
__path__: /var/log/app/*.log
```

Watches all `.log` files in the application's log directory (shared via Docker volume).

### 2. JSON Parsing

Extracts fields from structured JSON logs:

| Field | Source | Purpose |
|-------|--------|---------|
| `level` | `level` | Log level (INFO, WARN, ERROR) |
| `logger` | `logger` | Logger name |
| `traceId` | `traceId` | OpenTelemetry trace ID |
| `spanId` | `spanId` | OpenTelemetry span ID |
| `storeNumber` | `metadata.storeNumber` | Request context |
| `orderNumber` | `metadata.orderNumber` | Request context |
| `userId` | `metadata.userId` | Request context |
| `sessionId` | `metadata.sessionId` | Request context |

### 3. Labels

Added to every log line for efficient querying:

- `level` - Enables filtering by log level
- `logger` - Enables filtering by logger class

### 4. Structured Metadata

Attached to logs but not indexed (lower cardinality cost):

- `traceId`, `spanId` - For trace correlation
- `storeNumber`, `orderNumber`, `userId`, `sessionId` - Request context

## Why This Configuration

- **JSON parsing:** Application uses StructuredLogger which outputs JSON
- **Structured metadata:** Enables clicking from a log line directly to its trace in Grafana
- **Selective labels:** Only `level` and `logger` are indexed to avoid high cardinality
- **Request metadata:** Preserved for debugging specific requests without indexing

## Integration Points

- **Application** writes JSON logs to `/app/logs/*.log` (mapped to `/var/log/app`)
- **Loki** receives processed logs with trace correlation metadata
- **Grafana** can navigate from logs → traces using `traceId`
