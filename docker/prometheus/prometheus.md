# prometheus.yml

## Purpose

Configures Prometheus to scrape metrics from all services in the observability stack. Prometheus is the central metrics collection system that powers Grafana dashboards and alerting.

## Global Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| `scrape_interval` | 15s | Default interval for collecting metrics |
| `evaluation_interval` | 15s | How often to evaluate alerting rules |
| `external_labels.monitor` | reactive-test-monitor | Identifies this Prometheus instance |

## Scrape Targets

### reactive-test (Spring Boot Application)

- **Path:** `/actuator/prometheus`
- **Target:** `reactive-test:8080`
- **Interval:** 5s (more frequent for application metrics)
- **Metrics include:**
  - Resilience4j circuit breaker, retry, timeout, bulkhead metrics
  - HTTP request latencies and counts
  - JVM metrics (memory, GC, threads)
  - Custom application metrics

### prometheus (Self-monitoring)

- **Target:** `localhost:9090`
- **Interval:** 15s (default)
- **Purpose:** Monitor Prometheus health and performance

### tempo (Tracing Backend)

- **Target:** `tempo:3200`
- **Interval:** 15s (default)
- **Purpose:** Monitor trace ingestion rates and storage

### loki (Log Aggregation)

- **Target:** `loki:3100`
- **Interval:** 15s (default)
- **Purpose:** Monitor log ingestion and query performance

### redis (Cache Metrics)

- **Target:** `redis-exporter:9121`
- **Interval:** 15s (default)
- **Purpose:** Monitor cache hit rates, memory usage, connections

## Key Metrics Available

After scraping, Prometheus provides metrics for:

- **Resilience4j:** `resilience4j_circuitbreaker_*`, `resilience4j_retry_*`, `resilience4j_bulkhead_*`
- **HTTP:** `http_server_requests_*`
- **Redis:** `redis_*` (via redis-exporter)
- **JVM:** `jvm_memory_*`, `jvm_gc_*`, `jvm_threads_*`
