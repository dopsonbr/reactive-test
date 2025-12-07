# OAuth Circuit Breaker Test

## Purpose

Validates circuit breaker behavior when downstream OAuth token server fails. Tests that the circuit opens after repeated failures, provides fast failures while open, and recovers when the OAuth server heals.

## Goals

1. **Validate Circuit Opening** - Circuit opens after failure threshold is met
2. **Test Fast Failure** - Open circuit returns quickly without waiting for timeout
3. **Verify Half-Open State** - Circuit allows probe requests to test recovery
4. **Test Full Recovery** - Circuit closes and normal operation resumes

## Test Phases

| Phase | Duration | Start Time | Scenario |
|-------|----------|------------|----------|
| 1. Warmup | 20s | 0s | Establish baseline, cache tokens |
| 2. Trigger Circuit | 30s | 20s | Fail downstream OAuth to trip circuit |
| 3. Verify Open | 15s | 50s | Confirm fast failures (circuit open) |
| 4. Heal | 20s | 65s | Restore OAuth, allow circuit recovery |
| 5. Verify Recovery | 20s | 85s | Confirm normal operation restored |

**Total Duration**: ~105 seconds

## Phase Details

### Phase 1: Warmup (20s)
- **VUs**: 5
- **Goal**: Establish healthy baseline, populate token cache
- **Expected**: All requests succeed with valid tokens

### Phase 2: Trigger Circuit (30s)
- **VUs**: 20 (higher load to quickly accumulate failures)
- **Chaos State**: `error-500` on downstream OAuth
- **Goal**: Generate enough failures to trip circuit breaker
- **Expected**: Requests start failing, circuit should open

### Phase 3: Verify Open (15s)
- **VUs**: 10
- **Goal**: Confirm circuit is open and failing fast
- **Expected**: Responses < 50ms with 503/504 status
- **Metric**: `fast_failures` rate > 50%

### Phase 4: Heal (20s)
- **VUs**: 5
- **Chaos State**: `Started` (normal)
- **Goal**: Allow circuit to transition HALF_OPEN → CLOSED
- **Expected**: Probe requests succeed, circuit closes

### Phase 5: Verify Recovery (20s)
- **VUs**: 10
- **Goal**: Confirm full recovery
- **Expected**: All requests succeed, normal latency

## Thresholds

| Metric | Phase | Threshold | Description |
|--------|-------|-----------|-------------|
| `http_req_duration` | verify_open | p95 < 100ms | Fast failures when circuit open |
| `http_req_duration` | verify_recovery | p95 < 500ms | Normal latency after recovery |
| `fast_failures` | verify_open | rate > 50% | At least half should be fast failures |

## Custom Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `circuit_open_events` | Counter | Detected circuit open (fast 503/504) |
| `fallback_responses` | Counter | Responses with fallback values |
| `fast_failures` | Rate | Percentage of sub-50ms failure responses |

## Running the Test

### Docker

```bash
cd docker
docker compose up -d
docker compose --profile oauth-chaos run k6-oauth-circuit-breaker
```

### Local

```bash
k6 run \
  -e BASE_URL=http://localhost:8080 \
  -e WIREMOCK_URL=http://localhost:8081 \
  perf-test/k6/oauth-circuit-breaker-test.js
```

## Circuit Breaker State Machine

```
                  ┌─────────────────────────────────────┐
                  │                                     │
                  ▼                                     │
              ┌────────┐                                │
              │ CLOSED │ ──failure rate > 50%──────────>│
              └────────┘                                │
                  ▲                                     │
                  │                                     ▼
    probe succeeds│                               ┌──────────┐
                  │                               │   OPEN   │
                  │                               └──────────┘
                  │                                     │
                  │                                     │
                  │              wait duration          │
                  │              (10 seconds)           │
                  │                                     ▼
              ┌───────────┐                       ┌──────────┐
              │  CLOSED   │ <──probe succeeds──── │HALF_OPEN │
              └───────────┘                       └──────────┘
                                                       │
                                                       │
                                    probe fails        │
                                                       │
                                                       ▼
                                                 ┌──────────┐
                                                 │   OPEN   │
                                                 └──────────┘
```

## Expected Behavior

### Warmup
- Circuit is CLOSED
- All requests succeed
- OAuth tokens acquired and cached

### Trigger Circuit
- OAuth token endpoint returns 500s
- Downstream calls fail without valid token
- After ~5 failures (50% of 10-call window), circuit opens
- Subsequent requests fail fast

### Verify Open
- Circuit is OPEN
- Requests return immediately (< 50ms) with 503
- No calls made to downstream services
- Resource protection active

### Heal
- OAuth endpoint restored
- Circuit transitions to HALF_OPEN after 10s
- Probe requests allowed through
- Successful probes close the circuit

### Verify Recovery
- Circuit is CLOSED
- All requests succeed
- Normal latency restored

## Monitoring

### Actuator Endpoints

```bash
# Check circuit breaker status
curl http://localhost:8080/actuator/circuitbreakers

# Check specific circuit breaker
curl http://localhost:8080/actuator/health | jq '.components.circuitBreakers'
```

### Prometheus Metrics

```promql
# Circuit breaker state (1=CLOSED, 0.5=HALF_OPEN, 0=OPEN)
resilience4j_circuitbreaker_state{name="merchandise"}

# Failure rate
resilience4j_circuitbreaker_failure_rate{name="merchandise"}

# Calls not permitted (circuit open)
resilience4j_circuitbreaker_not_permitted_calls_total{name="merchandise"}
```

## Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Circuit doesn't open | Not enough failures | Increase VUs or extend trigger phase |
| No fast failures | Circuit config wrong | Check `sliding-window-size` config |
| Recovery too slow | Wait duration too long | Adjust `wait-duration-in-open-state` |
| Circuit stays open | Half-open probes failing | Verify OAuth server healed properly |

## Configuration Reference

The circuit breaker configuration in `application.yml`:

```yaml
resilience4j:
  circuitbreaker:
    configs:
      default:
        sliding-window-type: COUNT_BASED
        sliding-window-size: 10
        minimum-number-of-calls: 5
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10s
        permitted-number-of-calls-in-half-open-state: 3
```

## Related Files

- `perf-test/wiremock/mappings/downstream-oauth/token-chaos.json` - Chaos scenarios
- `src/main/resources/application.yml` - Resilience4j config
- `src/main/java/org/example/reactivetest/resilience/` - Resilience decorators
