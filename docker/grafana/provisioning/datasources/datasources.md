# datasources.yml

## Purpose

Auto-provisions Grafana data sources on startup. This eliminates manual configuration and ensures consistent connections to Prometheus, Loki, and Tempo.

## Data Sources

### Prometheus

| Setting | Value | Purpose |
|---------|-------|---------|
| `url` | http://prometheus:9090 | Metrics backend |
| `isDefault` | true | Default for new panels |
| `httpMethod` | POST | Enables larger queries |

**Trace Correlation:**
```yaml
exemplarTraceIdDestinations:
  - name: trace_id
    datasourceUid: tempo
```
Enables clicking from a metric exemplar directly to its trace in Tempo.

### Loki

| Setting | Value | Purpose |
|---------|-------|---------|
| `url` | http://loki:3100 | Log aggregation backend |

**Trace Correlation:**
```yaml
derivedFields:
  - datasourceUid: tempo
    matcherRegex: '"traceId"\s*:\s*"([a-f0-9]+)"'
    name: TraceID
```
Extracts `traceId` from JSON logs and creates clickable links to Tempo.

### Tempo

| Setting | Value | Purpose |
|---------|-------|---------|
| `url` | http://tempo:3200 | Tracing backend |

**Integrations:**

| Feature | Target | Purpose |
|---------|--------|---------|
| `tracesToLogs` | Loki | Jump from trace → related logs |
| `tracesToMetrics` | Prometheus | Jump from trace → related metrics |
| `serviceMap` | Prometheus | Visualize service dependencies |
| `nodeGraph` | enabled | Interactive trace visualization |
| `lokiSearch` | Loki | Search logs from trace view |

## Why This Matters

This configuration enables the **three pillars of observability** to be fully correlated:

1. **Metrics → Traces:** Click a spike in latency → see the slow traces
2. **Logs → Traces:** Click a log line → see the full request trace
3. **Traces → Logs:** View a trace → see all logs from that request
4. **Traces → Metrics:** View a trace → see related service metrics

## Time Shift Settings

```yaml
spanStartTimeShift: '-1h'
spanEndTimeShift: '1h'
```

When jumping from trace to logs, Grafana searches logs within 1 hour before/after the trace. This handles clock drift and ensures related logs are found.
