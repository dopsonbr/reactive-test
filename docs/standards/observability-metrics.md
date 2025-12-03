# Metrics Standard

## Intent

Provide quantitative data for monitoring, alerting, and capacity planning through Prometheus-compatible metrics.

## Outcomes

- Prometheus-compatible metrics endpoint
- Circuit breaker state visibility
- Request rate and latency tracking
- Resource utilization monitoring
- Actionable alerts based on thresholds

## Patterns

### Required Metrics

Every service MUST expose these metrics:

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `http_server_requests_seconds` | histogram | uri, method, status | Request latency |
| `resilience4j_circuitbreaker_state` | gauge | name | Circuit breaker status |
| `resilience4j_circuitbreaker_calls_total` | counter | name, kind | Call outcomes |
| `resilience4j_retry_calls_total` | counter | name, kind | Retry outcomes |
| `resilience4j_bulkhead_available_concurrent_calls` | gauge | name | Bulkhead capacity |
| `cache_gets_total` | counter | name, result | Cache hit/miss |
| `cache_puts_total` | counter | name | Cache writes |

### Actuator Configuration

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,prometheus,info,metrics
      base-path: /actuator

  endpoint:
    health:
      show-details: always
      probes:
        enabled: true

  prometheus:
    metrics:
      export:
        enabled: true

  metrics:
    tags:
      application: ${spring.application.name}
    distribution:
      percentiles-histogram:
        http.server.requests: true
      percentiles:
        http.server.requests: 0.5, 0.95, 0.99
```

### Health Indicators

Circuit breakers and other resilience components register as health indicators:

```yaml
resilience4j:
  circuitbreaker:
    configs:
      default:
        register-health-indicator: true
```

Health response:
```json
{
  "status": "UP",
  "components": {
    "circuitBreakers": {
      "status": "UP",
      "details": {
        "merchandise-service": {
          "status": "UP",
          "details": {
            "state": "CLOSED",
            "failureRate": "-1%",
            "slowCallRate": "-1%",
            "bufferedCalls": 0,
            "failedCalls": 0
          }
        }
      }
    },
    "redis": {
      "status": "UP",
      "details": {
        "version": "7.0.0"
      }
    }
  }
}
```

### Custom Metrics

Add business metrics using Micrometer:

```java
@Component
class ProductMetrics {
    private final Counter productRequests;
    private final Timer productLatency;

    ProductMetrics(MeterRegistry registry) {
        this.productRequests = Counter.builder("product.requests")
            .description("Product requests by SKU")
            .tag("type", "lookup")
            .register(registry);

        this.productLatency = Timer.builder("product.latency")
            .description("Product fetch latency")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(registry);
    }

    void recordRequest(long sku) {
        productRequests.increment();
    }

    <T> Mono<T> timeOperation(Mono<T> operation) {
        return Mono.defer(() -> {
            long start = System.nanoTime();
            return operation.doFinally(signal ->
                productLatency.record(System.nanoTime() - start, TimeUnit.NANOSECONDS));
        });
    }
}
```

### Metric Naming Conventions

Follow Prometheus naming conventions:

| Pattern | Example | Description |
|---------|---------|-------------|
| `{namespace}_{name}_{unit}` | `http_requests_total` | Counter |
| `{namespace}_{name}_{unit}` | `request_duration_seconds` | Histogram |
| `{namespace}_{name}` | `circuitbreaker_state` | Gauge |

Units:
- `_seconds` for duration
- `_bytes` for size
- `_total` for counters
- No suffix for gauges

### Labels (Tags)

Use labels for dimensions, but avoid high cardinality:

```java
// Good - bounded cardinality
Counter.builder("http.requests")
    .tag("method", "GET")        // ~5 values
    .tag("status", "200")        // ~20 values
    .tag("uri", "/products/{sku}") // templated, not actual SKU
    .register(registry);

// Bad - unbounded cardinality
Counter.builder("http.requests")
    .tag("sku", String.valueOf(sku))  // millions of values!
    .tag("userId", userId)            // millions of values!
    .register(registry);
```

### Prometheus Scraping

Configure Prometheus to scrape the metrics endpoint:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'product-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['product-service:8080']
    scrape_interval: 15s
```

### Alerting Rules

Define alerts based on metrics:

```yaml
# alerts.yml
groups:
  - name: service-alerts
    rules:
      - alert: CircuitBreakerOpen
        expr: resilience4j_circuitbreaker_state{state="open"} == 1
        for: 30s
        labels:
          severity: warning
        annotations:
          summary: "Circuit breaker {{ $labels.name }} is OPEN"

      - alert: HighErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 0.1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.uri }}"

      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P99 latency > 2s on {{ $labels.uri }}"
```

### Grafana Dashboards

Key panels for service dashboards:

1. **Request Rate**: `rate(http_server_requests_seconds_count[5m])`
2. **Error Rate**: `rate(http_server_requests_seconds_count{status=~"5.."}[5m])`
3. **Latency (P99)**: `histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m]))`
4. **Circuit Breaker State**: `resilience4j_circuitbreaker_state`
5. **Cache Hit Rate**: `rate(cache_gets_total{result="hit"}[5m]) / rate(cache_gets_total[5m])`

## Anti-patterns

### High-Cardinality Labels

```java
// DON'T - creates millions of time series
Counter.builder("requests")
    .tag("user_id", userId)      // Millions of users
    .tag("order_id", orderId)    // Millions of orders
    .tag("sku", sku)             // Thousands of SKUs
    .register(registry);

// DO - use bounded labels only
Counter.builder("requests")
    .tag("endpoint", "/products")
    .tag("method", "GET")
    .tag("status", "200")
    .register(registry);
```

### Metrics Without Labels

```java
// DON'T - can't filter or group
Counter.builder("requests").register(registry);

// DO - include useful dimensions
Counter.builder("requests")
    .tag("service", "product-service")
    .tag("endpoint", endpoint)
    .register(registry);
```

### Missing Circuit Breaker Health Indicators

```yaml
# DON'T - no visibility
resilience4j:
  circuitbreaker:
    configs:
      default:
        # register-health-indicator not set

# DO - enable health indicators
resilience4j:
  circuitbreaker:
    configs:
      default:
        register-health-indicator: true
```

### Not Exposing Prometheus Endpoint

```yaml
# DON'T - metrics not accessible
management:
  endpoints:
    web:
      exposure:
        include: health

# DO - expose prometheus
management:
  endpoints:
    web:
      exposure:
        include: health,prometheus,metrics
```

### Gauge for Counters

```java
// DON'T - gauge resets on restart, loses history
Gauge.builder("requests", () -> requestCount.get())
    .register(registry);

// DO - use counter for monotonic values
Counter.builder("requests")
    .register(registry)
    .increment();
```

### Timer Without Percentiles

```yaml
# DON'T - only average available
management:
  metrics:
    # No percentile configuration

# DO - enable percentiles
management:
  metrics:
    distribution:
      percentiles:
        http.server.requests: 0.5, 0.95, 0.99
```

### Metrics in Hot Path Without Sampling

```java
// DON'T - metric overhead in tight loop
for (Item item : items) {
    counter.increment();  // 10000 increments/request
}

// DO - batch or sample
counter.increment(items.size());  // Single increment
```

## Reference

- `apps/product-service/src/main/resources/application.yml` - Actuator config
- `docker/prometheus/prometheus.yml` - Scrape configuration
- `docker/grafana/dashboards/` - Dashboard definitions
