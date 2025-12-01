# Load Test

## Purpose

Standard performance and load testing to validate system behavior under normal operating conditions.

## Goals

1. **Verify System Performance** - Ensure the application meets latency SLAs under load
2. **Validate Throughput** - Confirm the system can handle expected request volumes
3. **Check Error Rates** - Verify error rates stay within acceptable bounds
4. **Metadata Correlation** - Ensure request metadata propagates correctly through all log entries

## Test Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Virtual Users | 50 | Concurrent users (configurable via CLI) |
| Iterations | 10,000 | Total requests to execute |
| Request Type | GET /products/{sku} | Product retrieval endpoint |

## Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| `http_req_failed` | < 1% | Maximum acceptable failure rate |
| `http_req_duration` (p95) | < 500ms | 95th percentile latency |
| `http_req_duration` (p99) | < 2000ms | 99th percentile (allows for retries) |

## Request Headers

Each request includes metadata headers for tracing:

```
x-store-number: <integer 1-2000>
x-order-number: <UUID>
x-userid: <6 alphanumeric chars>
x-sessionid: <UUID>
```

## Checks

- **Status is 200** - Response returns successfully
- **Response has SKU** - Response body contains the requested SKU

## Running the Test

### Docker (Recommended)

```bash
cd docker
docker compose up -d
docker compose --profile test up k6
```

### Local

```bash
k6 run --vus 50 --iterations 10000 perf-test/k6/load-test.js
```

### With Custom Parameters

```bash
k6 run \
  --vus 100 \
  --iterations 50000 \
  -e BASE_URL=http://localhost:8080 \
  perf-test/k6/load-test.js
```

## Expected Results

Under normal conditions with healthy backend services:

- **Success Rate**: > 99%
- **p95 Latency**: < 500ms
- **p99 Latency**: < 2000ms
- **Throughput**: ~100-200 req/s (depends on hardware)

## Metrics Output

Results are sent to Prometheus when running in Docker:

- `http_req_duration` - Request latency histogram
- `http_req_failed` - Failure rate
- `k6_vus` - Active virtual users
- `k6_iterations_total` - Total completed iterations

## Log Validation

After the test, validate log correlation:

1. Check that all logs contain correct `traceId` and `spanId`
2. Verify metadata appears in controller, service, and repository logs
3. Confirm log sequence: request → service → 3x repository → response

## Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| High failure rate | Backend services down | Check WireMock is running |
| High latency | Slow backend responses | Check WireMock delay config |
| Connection errors | App not healthy | Check `docker compose ps` |
