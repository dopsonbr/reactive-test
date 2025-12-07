# OAuth Chaos Test

## Purpose

Multi-phase chaos testing to validate system resilience when the downstream OAuth token server experiences failures. This test verifies the application handles OAuth client credentials failures gracefully while still serving requests.

## Goals

1. **Validate OAuth Resilience** - System handles downstream OAuth failures without cascading
2. **Test Token Acquisition Failures** - Verify behavior when client credentials flow fails
3. **Verify Recovery** - System returns to normal after OAuth server recovers
4. **Measure Auth Metrics** - Track authentication failures and degraded responses

## Test Phases

| Phase | Duration | Start Time | Scenario |
|-------|----------|------------|----------|
| 1. Baseline | 30s | 0s | Downstream OAuth healthy |
| 2. OAuth Timeout | 30s | 30s | Token endpoint times out (5s delay) |
| 3. OAuth 500 Errors | 30s | 60s | Token endpoint returns 500s |
| 4. OAuth 503 Errors | 30s | 90s | Token endpoint returns 503 (service unavailable) |
| 5. Expired Tokens | 30s | 120s | Token endpoint returns tokens with 1s expiry |
| 6. Recovery | 30s | 150s | OAuth server restored to healthy |

**Total Duration**: ~3 minutes

## Chaos Scenarios

### Phase 2: OAuth Timeout
- **Failure Type**: 5 second delay on token endpoint
- **Expected Behavior**: Requests may fail or use cached token if available
- **WireMock State**: `timeout`

### Phase 3: OAuth 500 Errors
- **Failure Type**: HTTP 500 Internal Server Error from token endpoint
- **Expected Behavior**: Client credentials flow fails, downstream calls unauthorized
- **WireMock State**: `error-500`

### Phase 4: OAuth 503 Errors
- **Failure Type**: HTTP 503 Service Unavailable from token endpoint
- **Expected Behavior**: Similar to 500 errors, retryable
- **WireMock State**: `error-503`

### Phase 5: Expired Tokens
- **Failure Type**: Token endpoint returns tokens that expire in 1 second
- **Expected Behavior**: Frequent token refresh, potential race conditions
- **WireMock State**: `expired-token`

## Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| `http_req_duration` | p95 < 1000ms | Requests should complete within 1s |
| `auth_failures` | rate < 10% | Less than 10% authentication failures in normal operation |
| `http_req_failed` | rate < 30% | Allow higher failure rate during chaos phases |

## Custom Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `auth_failures` | Rate | Percentage of requests resulting in 401/403 |
| `token_refresh_count` | Counter | Number of token refresh attempts |
| `token_refresh_latency` | Trend | Time taken to refresh tokens |

## Running the Test

### Docker

```bash
cd docker
docker compose up -d
docker compose --profile oauth-chaos up k6-oauth-chaos
```

### Local

```bash
k6 run \
  -e BASE_URL=http://localhost:8080 \
  -e WIREMOCK_URL=http://localhost:8081 \
  perf-test/k6/oauth-chaos-test.js
```

## WireMock Chaos Control

The test uses WireMock scenarios to control OAuth server behavior:

```bash
# Set timeout scenario
curl -X PUT http://localhost:8081/__admin/scenarios/downstream-oauth-chaos/state \
  -H 'Content-Type: application/json' \
  -d '{"state": "timeout"}'

# Set 500 error scenario
curl -X PUT http://localhost:8081/__admin/scenarios/downstream-oauth-chaos/state \
  -H 'Content-Type: application/json' \
  -d '{"state": "error-500"}'

# Reset to normal
curl -X PUT http://localhost:8081/__admin/scenarios/downstream-oauth-chaos/state \
  -H 'Content-Type: application/json' \
  -d '{"state": "Started"}'
```

## Expected Behavior

### Baseline Phase
- All requests succeed with valid inbound JWT
- Downstream services called with OAuth client credentials token
- No authentication failures

### Chaos Phases
- Inbound JWT validation continues to work (independent of downstream OAuth)
- Downstream service calls may fail without client credentials token
- System should return 503/504 for downstream failures, not 401/403 for inbound auth

### Recovery Phase
- OAuth client credentials flow resumes
- Downstream services receive valid tokens
- Error rate returns to baseline

## Token Flow

```
Inbound Request          Application              Downstream OAuth        Downstream Services
      │                       │                          │                        │
      │ Bearer <JWT>          │                          │                        │
      │──────────────────────>│                          │                        │
      │                       │ (validates JWT locally)  │                        │
      │                       │                          │                        │
      │                       │ POST /token              │                        │
      │                       │ (client_credentials)     │                        │
      │                       │─────────────────────────>│                        │
      │                       │                          │                        │
      │                       │ access_token             │                        │
      │                       │<─────────────────────────│                        │
      │                       │                          │                        │
      │                       │ GET /merchandise (+ token)                        │
      │                       │────────────────────────────────────────────────────>│
      │                       │                                                    │
      │ Product               │<────────────────────────────────────────────────────│
      │<──────────────────────│                                                    │
```

## Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| All requests fail 401 | Inbound JWT validation failing | Check JWKS endpoint in WireMock |
| No chaos effect | WireMock scenarios not configured | Verify `downstream-oauth/token-chaos.json` loaded |
| Slow recovery | Token cache not refreshing | Check Spring OAuth2 client cache config |
| High baseline failures | WireMock not serving tokens | Verify `downstream-oauth/token.json` mapping |

## Related Files

- `perf-test/wiremock/mappings/downstream-oauth/token.json` - Normal token endpoint
- `perf-test/wiremock/mappings/downstream-oauth/token-chaos.json` - Chaos scenarios
- `perf-test/wiremock/mappings/oauth/jwks.json` - JWKS for inbound JWT validation
