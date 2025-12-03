import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const WIREMOCK_URL = __ENV.WIREMOCK_URL || 'http://localhost:8081';

const circuitOpenEvents = new Counter('circuit_open_events');
const fallbackResponses = new Counter('fallback_responses');
const fastFailures = new Rate('fast_failures');

export const options = {
    scenarios: {
        // Phase 1: Warmup - establish baseline with healthy OAuth
        warmup: {
            executor: 'constant-vus',
            vus: 5,
            duration: '20s',
            startTime: '0s',
            tags: { phase: 'warmup' }
        },
        // Phase 2: Trigger circuit breaker by failing downstream OAuth
        trigger_circuit: {
            executor: 'constant-vus',
            vus: 20,
            duration: '30s',
            startTime: '20s',
            tags: { phase: 'trigger' },
            exec: 'triggerCircuit'
        },
        // Phase 3: Verify circuit is open (fast failures)
        verify_open: {
            executor: 'constant-vus',
            vus: 10,
            duration: '15s',
            startTime: '50s',
            tags: { phase: 'verify_open' },
            exec: 'verifyOpen'
        },
        // Phase 4: Heal downstream, allow circuit recovery
        heal: {
            executor: 'constant-vus',
            vus: 5,
            duration: '20s',
            startTime: '65s',
            tags: { phase: 'heal' },
            exec: 'healPhase'
        },
        // Phase 5: Verify recovery
        verify_recovery: {
            executor: 'constant-vus',
            vus: 10,
            duration: '20s',
            startTime: '85s',
            tags: { phase: 'verify_recovery' }
        }
    },
    thresholds: {
        // During trigger phase, expect failures
        'http_req_duration{phase:verify_open}': ['p(95)<100'], // Fast fail when circuit open
        'http_req_duration{phase:verify_recovery}': ['p(95)<500'], // Should recover
        'fast_failures{phase:verify_open}': ['rate>0.5'] // At least 50% should be fast failures
    }
};

function generateTestToken() {
    return 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODEvb2F1dGgiLCJzdWIiOiJ0ZXN0LXVzZXIiLCJhdWQiOiJyZWFjdGl2ZS10ZXN0LWFwaSIsInNjb3BlIjoicHJvZHVjdDpyZWFkIiwiZXhwIjo5OTk5OTk5OTk5fQ.mock-signature';
}

function setChaosState(scenario, state) {
    const response = http.put(
        `${WIREMOCK_URL}/__admin/scenarios/${scenario}/state`,
        JSON.stringify({ state: state }),
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response.status === 200;
}

export function setup() {
    setChaosState('downstream-oauth-chaos', 'Started');
    console.log('OAuth Circuit Breaker Test - Starting');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`WireMock URL: ${WIREMOCK_URL}`);
}

export function teardown() {
    setChaosState('downstream-oauth-chaos', 'Started');
    console.log('OAuth Circuit Breaker Test - Complete');
}

// Default function for warmup and recovery phases
export default function() {
    makeRequest();
}

// Trigger circuit breaker by causing OAuth failures
export function triggerCircuit() {
    setChaosState('downstream-oauth-chaos', 'error-500');
    makeRequest();
}

// Verify circuit is open - expect fast failures
export function verifyOpen() {
    const startTime = Date.now();
    const response = makeRequest();
    const duration = Date.now() - startTime;

    // If response is very fast (< 50ms), circuit is likely open
    if (duration < 50 && (response.status === 503 || response.status === 504)) {
        circuitOpenEvents.add(1);
        fastFailures.add(1);
    } else {
        fastFailures.add(0);
    }
}

// Heal phase - restore OAuth and let circuit recover
export function healPhase() {
    setChaosState('downstream-oauth-chaos', 'Started');
    makeRequest();
}

function makeRequest() {
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

    // Check for fallback responses (indicates resilience is working)
    if (response.status === 200 && response.body) {
        try {
            const body = JSON.parse(response.body);
            if (body.price === '0.00' || body.description === 'Description unavailable') {
                fallbackResponses.add(1);
            }
        } catch (e) {
            // Ignore JSON parse errors
        }
    }

    check(response, {
        'not a 5xx error or graceful degradation': (r) =>
            r.status < 500 || r.status === 503 || r.status === 504
    });

    sleep(0.05);
    return response;
}
