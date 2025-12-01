# Resilience Test

## Purpose

Multi-phase chaos testing to validate system resilience under various failure conditions. This test progressively introduces failures and verifies the application degrades gracefully.

## Goals

1. **Validate Graceful Degradation** - System returns fallback responses instead of errors
2. **Test Fault Isolation** - One failing service doesn't cascade to others
3. **Verify Recovery** - System returns to normal after failures resolve
4. **Measure Resilience Metrics** - Track fallback activations and degraded responses

## Test Phases

| Phase | Duration | Start Time | Scenario |
|-------|----------|------------|----------|
| 1. Baseline | 30s | 0s | All services healthy |
| 2. Price Errors | 30s | 35s | Price service returns 500s |
| 3. Merchandise Timeout | 30s | 70s | Merchandise service times out |
| 4. Inventory 503 | 30s | 105s | Inventory returns 503 (retryable) |
| 5. Full Chaos | 30s | 140s | All services degraded |
| 6. Recovery | 30s | 175s | Services restored to healthy |

**Total Duration**: ~3.5 minutes

## Chaos Scenarios

### Phase 2: Price Service Errors
- **Failure Type**: HTTP 500 Internal Server Error
- **Expected Behavior**: Fallback returns `price: "0.00"`
- **Circuit Breaker**: Should trip after 50% failure rate

### Phase 3: Merchandise Timeout
- **Failure Type**: 10 second delay (exceeds 2s timeout)
- **Expected Behavior**: Fallback returns `description: "Description unavailable"`
- **Timeout**: Requests fail fast at 2 seconds

### Phase 4: Inventory 503
- **Failure Type**: HTTP 503 Service Unavailable
- **Expected Behavior**: Retry attempts, then fallback `availableQuantity: 0`
- **Retries**: Up to 3 attempts with exponential backoff

### Phase 5: Full Chaos
- **Price**: 500 errors
- **Merchandise**: Slow responses (1.5-2.5s)
- **Inventory**: 503 errors
- **Expected**: System remains responsive with degraded data

## Thresholds

| Metric | Phase | Threshold | Description |
|--------|-------|-----------|-------------|
| `http_req_failed` | baseline | < 1% | Near-zero failures when healthy |
| `http_req_duration` | baseline | p95 < 500ms | Normal latency |
| `http_req_failed` | recovery | < 5% | Quick stabilization |
| `http_req_failed` | price_errors | < 20% | Fallbacks absorb failures |
| `http_req_failed` | merchandise_timeout | < 30% | Timeouts handled |
| `http_req_failed` | inventory_503 | < 20% | Retries help |
| `http_req_failed` | full_chaos | < 50% | System survives |
| `degraded_responses` | all | > 0 | Fallbacks activated |

## Custom Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `degraded_responses` | Counter | Responses with fallback values |
| `fallback_activations` | Counter | Times fallback was triggered |
| `circuit_breaker_trips` | Counter | Circuit breaker open events |
| `recovery_time_ms` | Trend | Time to recover from failures |

## Running the Test

### Docker

```bash
cd docker
docker compose up -d
docker compose --profile chaos up k6-resilience
```

### Local

```bash
k6 run \
  -e BASE_URL=http://localhost:8080 \
  -e WIREMOCK_URL=http://localhost:8081 \
  perf-test/k6/resilience-test.js
```

## Expected Behavior

### Baseline Phase
- All requests succeed with real data
- No fallback values in responses
- Latency within normal range

### Chaos Phases
- Requests continue to succeed (200 status)
- Responses contain fallback values for failed services
- Other services return real data
- No cascading failures

### Recovery Phase
- System returns to normal within seconds
- Real data replaces fallback values
- Error rate drops to baseline levels

## Fallback Values

| Service | Normal Response | Fallback Response |
|---------|----------------|-------------------|
| Price | `"99.99"` | `"0.00"` |
| Merchandise | `"Test Product Description"` | `"Description unavailable"` |
| Inventory | `100` | `0` |

## Verifying Results

1. **Check Grafana Dashboard**
   - Circuit breaker state changes (CLOSED → OPEN → HALF_OPEN → CLOSED)
   - Failure rate spikes during chaos phases
   - Recovery time after healing

2. **Check k6 Output**
   - `degraded_responses` counter > 0
   - Phase-specific thresholds pass
   - No unexpected failures

3. **Check Application Logs**
   - Error logs during chaos phases
   - Circuit breaker state logged
   - Fallback activation messages

## Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| No degraded responses | Fallbacks not working | Check repository error handling |
| High failure rate in baseline | Services unhealthy | Verify WireMock started correctly |
| Recovery phase failures | Circuit stuck open | Check `waitDurationInOpenState` config |
| Chaos not triggering | WireMock scenarios not set | Verify chaos-controller.js calls work |
