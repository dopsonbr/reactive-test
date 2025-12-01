# loki-config.yml

## Purpose

Configures Grafana Loki as the log aggregation backend. Loki stores and indexes logs shipped from Promtail, enabling efficient log querying through LogQL in Grafana.

## Key Configuration

### Server

| Setting | Value | Purpose |
|---------|-------|---------|
| `http_listen_port` | 3100 | HTTP API for log ingestion and queries |
| `auth_enabled` | false | No authentication (local development) |

### Storage

| Setting | Value | Purpose |
|---------|-------|---------|
| `path_prefix` | /loki | Base path for all data |
| `chunks_directory` | /loki/chunks | Where compressed log chunks are stored |
| `rules_directory` | /loki/rules | Alerting rules location |
| `store` | inmemory | Ring store for single-instance mode |

### Schema

| Setting | Value | Purpose |
|---------|-------|---------|
| `store` | tsdb | Time-series database format (efficient) |
| `schema` | v13 | Latest schema version |
| `index.period` | 24h | Index rotation period |

### Limits

| Setting | Value | Purpose |
|---------|-------|---------|
| `allow_structured_metadata` | true | Enables trace ID correlation via structured metadata |
| `volume_enabled` | true | Enables log volume queries |
| `max_outstanding_requests_per_tenant` | 4096 | Supports high query concurrency |

## Why These Settings

- **TSDB storage:** More efficient than older BoltDB format, better compression
- **Structured metadata:** Critical for correlating logs with traces via `traceId` and `spanId`
- **Single-instance mode:** Appropriate for local development (no need for distributed ring)
- **High request limits:** Prevents query throttling during load tests

## Integration Points

- **Promtail** pushes logs to `http://loki:3100/loki/api/v1/push`
- **Grafana** queries logs via `http://loki:3100`
- **Tempo** links traces to logs using `traceId` in structured metadata
