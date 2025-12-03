import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const authFailures = new Rate('auth_failures');
const tokenRefreshCount = new Counter('token_refresh_count');
const tokenRefreshLatency = new Trend('token_refresh_latency');

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const WIREMOCK_URL = __ENV.WIREMOCK_URL || 'http://localhost:8081';

// Chaos states for downstream OAuth
const CHAOS_STATES = {
    NORMAL: 'Started',
    TIMEOUT: 'timeout',
    ERROR_500: 'error-500',
    ERROR_503: 'error-503',
    EXPIRED_TOKEN: 'expired-token'
};

export const options = {
    scenarios: {
        // Phase 1: Baseline (normal operations)
        baseline: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '0s',
            tags: { phase: 'baseline' }
        },
        // Phase 2: Downstream OAuth timeout
        oauth_timeout: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '30s',
            tags: { phase: 'oauth_timeout' },
            exec: 'oauthTimeoutPhase'
        },
        // Phase 3: Downstream OAuth 500 errors
        oauth_error_500: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '60s',
            tags: { phase: 'oauth_error_500' },
            exec: 'oauthError500Phase'
        },
        // Phase 4: Downstream OAuth 503 service unavailable
        oauth_error_503: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '90s',
            tags: { phase: 'oauth_error_503' },
            exec: 'oauthError503Phase'
        },
        // Phase 5: Expired tokens from downstream
        expired_tokens: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '120s',
            tags: { phase: 'expired_tokens' },
            exec: 'expiredTokensPhase'
        },
        // Phase 6: Recovery
        recovery: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '150s',
            tags: { phase: 'recovery' }
        }
    },
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        auth_failures: ['rate<0.1'], // Less than 10% auth failures in normal operation
        http_req_failed: ['rate<0.3'] // Allow higher failure rate during chaos
    }
};

// Generate a mock JWT token for testing
// In production tests, this would be a valid JWT from your OAuth server
function generateTestToken() {
    // This is a placeholder token that WireMock can validate
    // In real tests, generate a properly signed JWT or use a test OAuth server
    return 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODEvb2F1dGgiLCJzdWIiOiJ0ZXN0LXVzZXIiLCJhdWQiOiJyZWFjdGl2ZS10ZXN0LWFwaSIsInNjb3BlIjoicHJvZHVjdDpyZWFkIiwiZXhwIjo5OTk5OTk5OTk5fQ.mock-signature';
}

// Set chaos state via WireMock
function setChaosState(scenario, state) {
    const response = http.put(
        `${WIREMOCK_URL}/__admin/scenarios/${scenario}/state`,
        JSON.stringify({ state: state }),
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response.status === 200;
}

// Reset all chaos scenarios
function resetChaos() {
    setChaosState('downstream-oauth-chaos', CHAOS_STATES.NORMAL);
}

// Setup function - runs once before tests
export function setup() {
    resetChaos();
    console.log('OAuth Chaos Test - Starting');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`WireMock URL: ${WIREMOCK_URL}`);
}

// Teardown function - runs once after tests
export function teardown() {
    resetChaos();
    console.log('OAuth Chaos Test - Complete');
}

// Default function for baseline and recovery phases
export default function() {
    makeAuthenticatedRequest();
}

// OAuth timeout phase
export function oauthTimeoutPhase() {
    setChaosState('downstream-oauth-chaos', CHAOS_STATES.TIMEOUT);
    makeAuthenticatedRequest();
}

// OAuth 500 error phase
export function oauthError500Phase() {
    setChaosState('downstream-oauth-chaos', CHAOS_STATES.ERROR_500);
    makeAuthenticatedRequest();
}

// OAuth 503 error phase
export function oauthError503Phase() {
    setChaosState('downstream-oauth-chaos', CHAOS_STATES.ERROR_503);
    makeAuthenticatedRequest();
}

// Expired tokens phase
export function expiredTokensPhase() {
    setChaosState('downstream-oauth-chaos', CHAOS_STATES.EXPIRED_TOKEN);
    makeAuthenticatedRequest();
}

function makeAuthenticatedRequest() {
    const token = generateTestToken();
    // SKU must be 6+ digits (100000 - 999999) per validation rules
    const sku = 100000 + Math.floor(Math.random() * 900000);

    const params = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'x-store-number': '100',
            'x-order-number': '550e8400-e29b-41d4-a716-446655440000',
            'x-userid': 'user01',
            'x-sessionid': '550e8400-e29b-41d4-a716-446655440000'
        }
    };

    const response = http.get(`${BASE_URL}/products/${sku}`, params);

    // Track auth failures
    if (response.status === 401 || response.status === 403) {
        authFailures.add(1);
    } else {
        authFailures.add(0);
    }

    check(response, {
        'is successful or gracefully degraded': (r) =>
            r.status === 200 || r.status === 503 || r.status === 504,
        'has valid response body': (r) =>
            r.status !== 200 || (r.json() && r.json().sku)
    });

    sleep(0.1);
}
