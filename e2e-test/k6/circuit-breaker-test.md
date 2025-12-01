# Circuit Breaker Test

## Purpose

Focused testing of circuit breaker behavior to verify the circuit opens under failure conditions and recovers when the service heals.

## Goals

1. **Verify Circuit Opens** - Circuit breaker trips after failure threshold is reached
2. **Validate Fast-Fail** - Open circuit returns immediately (< 100ms)
3. **Test Half-Open State** - Circuit allows test requests after wait duration
4. **Confirm Recovery** - Circuit closes when service is healthy again

## Circuit Breaker Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Sliding Window Size | 10 | Number of calls to evaluate |
| Failure Rate Threshold | 50% | Opens circuit when exceeded |
| Wait Duration in Open | 10s | Time before half-open transition |
| Permitted Calls in Half-Open | 3 | Test calls allowed |
| Minimum Calls | 5 | Calls before evaluation starts |

## Test Phases

| Phase | Duration | Start Time | Rate | Purpose |
|-------|----------|------------|------|---------|
| 1. Warmup | 20s | 0s | 20/s | Establish baseline, fill sliding window |
| 2. Trigger | 15s | 25s | 50/s | Generate failures to trip circuit |
| 3. Verify Open | 10s | 45s | 30/s | Confirm fast-fail behavior |
| 4. Heal | 5s | 60s | 5/s | Restore service, allow half-open |
| 5. Recovery | 20s | 70s | 20/s | Verify circuit closes |

**Total Duration**: ~90 seconds

## Thresholds

| Metric | Phase | Threshold | Description |
|--------|-------|-----------|-------------|
| `http_req_failed` | warmup | < 1% | Healthy baseline |
| `http_req_duration` | verify_open | p95 < 100ms | Fast-fail when open |
| `http_req_failed` | recovery | < 10% | Circuit recovered |
| `circuit_breaker_open_responses` | all | > 0 | Circuit must trip |

## Custom Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `circuit_breaker_open_responses` | Counter | Responses with fallback (circuit open) |
| `normal_responses` | Counter | Successful responses with real data |
| `response_time_during_chaos` | Trend | Latency while circuit is open |

## Circuit Breaker State Machine

```
         ┌─────────────────────────────────────┐
         │                                     │
         ▼                                     │
    ┌─────────┐   failure rate > 50%    ┌─────────┐
    │ CLOSED  │ ─────────────────────▶  │  OPEN   │
    │         │                         │         │
    └─────────┘                         └─────────┘
         ▲                                     │
         │                                     │ wait 10s
         │  success in half-open               │
         │                                     ▼
         │                             ┌───────────┐
         └──────────────────────────── │ HALF_OPEN │
            3 successful calls         │           │
                                       └───────────┘
                                              │
                                              │ failure in half-open
                                              │
                                              ▼
                                        Back to OPEN
```

## Running the Test

### Docker

```bash
cd docker
docker compose up -d
docker compose --profile chaos run k6-circuit-breaker
```

### Local

```bash
k6 run \
  -e BASE_URL=http://localhost:8080 \
  -e WIREMOCK_URL=http://localhost:8081 \
  perf-test/k6/circuit-breaker-test.js
```

## Expected Behavior

### Phase 1: Warmup
- All requests succeed (200)
- Real price data returned (`"99.99"`)
- Latency ~30-100ms

### Phase 2: Trigger
- Price service returns 500 errors
- First few requests may fail
- After ~10 failed calls, circuit opens
- Subsequent requests get fallback (`"0.00"`)

### Phase 3: Verify Open
- Circuit is OPEN
- Requests return immediately (< 100ms)
- All responses have fallback price
- No actual calls to price service

### Phase 4: Heal
- Service restored to healthy
- Circuit transitions to HALF_OPEN after 10s
- Test requests sent to verify service

### Phase 5: Recovery
- Circuit transitions to CLOSED
- Real price data returned (`"99.99"`)
- Normal latency restored

## Verifying Results

### In k6 Output
```
✓ circuit_breaker_open_responses: count > 0
✓ http_req_duration{phase:verify_open}: p(95) < 100ms
✓ http_req_failed{phase:recovery}: rate < 10%
```

### In Grafana
1. **Circuit Breaker State Panel**
   - Shows transition: CLOSED → OPEN → HALF_OPEN → CLOSED

2. **Failure Rate Panel**
   - Spike during trigger phase
   - Drop during verify_open (fallbacks succeed)
   - Return to baseline during recovery

3. **Response Time Panel**
   - Normal during warmup
   - Very fast during verify_open (fast-fail)
   - Normal during recovery

### In Application Logs
```json
{"level":"error","logger":"pricerepository","data":{"type":"error","service":"price","errorType":"WebClientResponseException$InternalServerError"}}
```

## Key Assertions

| Assertion | Purpose |
|-----------|---------|
| Warmup succeeds | Baseline is healthy |
| Fast response when open | Circuit provides fast-fail |
| Graceful handling | No 500s returned to client |
| Recovery succeeds | Circuit closes properly |

## Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Circuit doesn't open | Not enough failures | Increase trigger duration/rate |
| Circuit stays open | Half-open failures | Check service actually healed |
| Slow responses when open | Fallback slow | Check repository fallback code |
| No fallback values | Error not caught | Verify `onErrorResume` in repository |

## Related Configuration

```yaml
# application.yml
resilience4j:
  circuitbreaker:
    instances:
      price:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10s
        permitted-number-of-calls-in-half-open-state: 3
```
