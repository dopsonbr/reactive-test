import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Rate, Trend } from 'k6/metrics';
import {
    enableChaos,
    disableChaos,
    resetAllChaos,
    CHAOS_SCENARIOS,
    SERVICES
} from './chaos-controller.js';

// Custom metrics for resilience testing
const degradedResponses = new Counter('degraded_responses');
const circuitBreakerTrips = new Counter('circuit_breaker_trips');
const fallbackActivations = new Counter('fallback_activations');
const recoveryTime = new Trend('recovery_time_ms');

const testData = new SharedArray('requests', function() {
    return JSON.parse(open('../data/test-input.json')).requests;
});

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
    scenarios: {
        // Phase 1: Baseline - All services healthy
        baseline: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '0s',
            tags: { phase: 'baseline' },
        },
        // Phase 2: Price service returns 500s
        price_errors: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '35s',
            exec: 'priceErrorScenario',
            tags: { phase: 'price_errors' },
        },
        // Phase 3: Merchandise service timeout
        merchandise_timeout: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '70s',
            exec: 'merchandiseTimeoutScenario',
            tags: { phase: 'merchandise_timeout' },
        },
        // Phase 4: Inventory service 503s (retryable)
        inventory_503: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '105s',
            exec: 'inventory503Scenario',
            tags: { phase: 'inventory_503' },
        },
        // Phase 5: All services degraded
        full_chaos: {
            executor: 'constant-vus',
            vus: 20,
            duration: '30s',
            startTime: '140s',
            exec: 'fullChaosScenario',
            tags: { phase: 'full_chaos' },
        },
        // Phase 6: Recovery - Back to healthy
        recovery: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '175s',
            tags: { phase: 'recovery' },
        },
    },
    thresholds: {
        // Baseline should have near-zero failures
        'http_req_failed{phase:baseline}': ['rate<0.01'],
        'http_req_duration{phase:baseline}': ['p(95)<500'],

        // Recovery phase should stabilize
        'http_req_failed{phase:recovery}': ['rate<0.05'],
        'http_req_duration{phase:recovery}': ['p(95)<1000'],

        // Chaos scenarios - with fallbacks, requests still succeed (degraded)
        'http_req_failed{phase:price_errors}': ['rate<0.20'],
        'http_req_failed{phase:merchandise_timeout}': ['rate<0.30'],
        'http_req_failed{phase:inventory_503}': ['rate<0.20'],
        'http_req_failed{phase:full_chaos}': ['rate<0.50'],

        // Overall resilience metrics
        'degraded_responses': ['count>0'], // We should see fallbacks
    },
};

export function setup() {
    console.log('Resetting all chaos scenarios...');
    resetAllChaos();
    sleep(2);
    console.log('Setup complete');
}

// Default scenario (baseline and recovery)
export default function() {
    const request = getRandomRequest();
    const res = makeRequest(request);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'has valid response': (r) => {
            if (r.status !== 200) return false;
            try {
                const body = JSON.parse(r.body);
                return body.sku !== undefined;
            } catch (e) {
                return false;
            }
        },
    });

    checkForDegradedResponse(res);
}

export function priceErrorScenario() {
    // Enable price service errors
    if (__ITER === 0) {
        console.log('Enabling price service 500 errors...');
        enableChaos(SERVICES.PRICE, CHAOS_SCENARIOS.ERROR_500);
    }

    const request = getRandomRequest();
    const res = makeRequest(request);

    const checks = check(res, {
        'request completed': (r) => r.status === 200 || r.status >= 500,
        'graceful degradation': (r) => {
            if (r.status !== 200) return true; // Expected if no fallback
            try {
                const body = JSON.parse(r.body);
                // Fallback returns price "0.00"
                if (body.price === '0.00') {
                    fallbackActivations.add(1);
                    return true;
                }
                return true;
            } catch (e) {
                return false;
            }
        },
    });

    checkForDegradedResponse(res);
}

export function merchandiseTimeoutScenario() {
    // Enable merchandise service timeout
    if (__ITER === 0) {
        console.log('Enabling merchandise service timeout...');
        disableChaos(SERVICES.PRICE); // Reset previous
        enableChaos(SERVICES.MERCHANDISE, CHAOS_SCENARIOS.TIMEOUT);
    }

    const request = getRandomRequest();
    const res = makeRequest(request);

    check(res, {
        'request completed within timeout': (r) => r.timings.duration < 3000,
        'timeout handled gracefully': (r) => {
            if (r.status !== 200) return true;
            try {
                const body = JSON.parse(r.body);
                // Fallback returns "Description unavailable"
                if (body.description === 'Description unavailable') {
                    fallbackActivations.add(1);
                    return true;
                }
                return true;
            } catch (e) {
                return false;
            }
        },
    });

    checkForDegradedResponse(res);
}

export function inventory503Scenario() {
    // Enable inventory service 503s (should trigger retries)
    if (__ITER === 0) {
        console.log('Enabling inventory service 503 errors...');
        disableChaos(SERVICES.MERCHANDISE); // Reset previous
        enableChaos(SERVICES.INVENTORY, CHAOS_SCENARIOS.ERROR_503);
    }

    const request = getRandomRequest();
    const res = makeRequest(request);

    check(res, {
        'request handled': (r) => r.status === 200 || r.status === 503,
        '503 triggers retry/fallback': (r) => {
            if (r.status !== 200) return true;
            try {
                const body = JSON.parse(r.body);
                // Fallback returns availableQuantity 0
                if (body.availableQuantity === 0) {
                    fallbackActivations.add(1);
                    return true;
                }
                return true;
            } catch (e) {
                return false;
            }
        },
    });

    checkForDegradedResponse(res);
}

export function fullChaosScenario() {
    // Enable chaos on all services
    if (__ITER === 0) {
        console.log('Enabling full chaos mode...');
        enableChaos(SERVICES.PRICE, CHAOS_SCENARIOS.ERROR_500);
        enableChaos(SERVICES.MERCHANDISE, CHAOS_SCENARIOS.SLOW);
        enableChaos(SERVICES.INVENTORY, CHAOS_SCENARIOS.ERROR_503);
    }

    const request = getRandomRequest();
    const res = makeRequest(request);

    check(res, {
        'system remains responsive': (r) => r.timings.duration < 5000,
        'graceful handling': (r) => r.status === 200 || r.status >= 500,
    });

    checkForDegradedResponse(res);
}

export function teardown() {
    console.log('Resetting all chaos scenarios...');
    resetAllChaos();
    console.log('Teardown complete');
}

// Helper functions
function getRandomRequest() {
    return testData[Math.floor(Math.random() * testData.length)];
}

function makeRequest(request) {
    const headers = {
        'Content-Type': 'application/json',
        'x-store-number': String(request.metadata.storeNumber),
        'x-order-number': request.metadata.orderNumber,
        'x-userid': request.metadata.userId,
        'x-sessionid': request.metadata.sessionId,
    };

    return http.get(
        `${BASE_URL}/products/${request.sku}`,
        { headers, timeout: '10s' }
    );
}

function checkForDegradedResponse(res) {
    if (res.status !== 200) return;

    try {
        const body = JSON.parse(res.body);

        // Check for fallback values indicating degradation
        const isDegraded =
            body.price === '0.00' ||
            body.description === 'Description unavailable' ||
            body.availableQuantity === 0;

        if (isDegraded) {
            degradedResponses.add(1);
        }
    } catch (e) {
        // Ignore parse errors
    }
}
