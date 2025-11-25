import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Trend } from 'k6/metrics';
import {
    enableChaos,
    disableChaos,
    resetAllChaos,
    CHAOS_SCENARIOS,
    SERVICES
} from './chaos-controller.js';

// Custom metrics
const circuitOpen = new Counter('circuit_breaker_open_responses');
const normalResponses = new Counter('normal_responses');
const responseTime = new Trend('response_time_during_chaos');

const testData = new SharedArray('requests', function() {
    return JSON.parse(open('../data/test-input.json')).requests;
});

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
    scenarios: {
        // Phase 1: Normal operation
        warmup: {
            executor: 'constant-arrival-rate',
            rate: 20,
            timeUnit: '1s',
            duration: '20s',
            preAllocatedVUs: 10,
            startTime: '0s',
            tags: { phase: 'warmup' },
        },
        // Phase 2: Trigger errors to open circuit breaker
        trigger_circuit: {
            executor: 'constant-arrival-rate',
            rate: 50,
            timeUnit: '1s',
            duration: '15s',
            preAllocatedVUs: 20,
            startTime: '25s',
            exec: 'triggerCircuitOpen',
            tags: { phase: 'trigger' },
        },
        // Phase 3: Verify fast-fail when circuit is open
        verify_open: {
            executor: 'constant-arrival-rate',
            rate: 30,
            timeUnit: '1s',
            duration: '10s',
            preAllocatedVUs: 10,
            startTime: '45s',
            exec: 'verifyCircuitOpen',
            tags: { phase: 'verify_open' },
        },
        // Phase 4: Heal service and verify recovery
        heal_service: {
            executor: 'constant-arrival-rate',
            rate: 5,
            timeUnit: '1s',
            duration: '5s',
            preAllocatedVUs: 5,
            startTime: '60s',
            exec: 'healService',
            tags: { phase: 'heal' },
        },
        // Phase 5: Verify circuit closes (half-open -> closed)
        verify_recovery: {
            executor: 'constant-arrival-rate',
            rate: 20,
            timeUnit: '1s',
            duration: '20s',
            preAllocatedVUs: 10,
            startTime: '70s',
            exec: 'verifyRecovery',
            tags: { phase: 'recovery' },
        },
    },
    thresholds: {
        // Warmup should be healthy
        'http_req_failed{phase:warmup}': ['rate<0.01'],

        // Fast-fail should be quick when circuit is open
        'http_req_duration{phase:verify_open}': ['p(95)<100'],

        // Recovery should succeed
        'http_req_failed{phase:recovery}': ['rate<0.10'],

        // Overall
        'circuit_breaker_open_responses': ['count>0'], // Circuit should trip
    },
};

export function setup() {
    console.log('Initializing circuit breaker test...');
    resetAllChaos();
    sleep(2);

    // Warm up the app
    for (let i = 0; i < 5; i++) {
        const request = testData[i % testData.length];
        makeRequest(request);
    }

    console.log('Setup complete');
    return { startTime: Date.now() };
}

// Phase 1: Normal operation (warmup)
export default function() {
    const request = getRandomRequest();
    const res = makeRequest(request);

    const success = check(res, {
        'warmup: status is 200': (r) => r.status === 200,
    });

    if (success) {
        normalResponses.add(1);
    }
}

// Phase 2: Generate errors to trip circuit breaker
export function triggerCircuitOpen() {
    // Enable price service errors on first iteration
    if (__ITER === 0) {
        console.log('Triggering circuit breaker by enabling price service errors...');
        enableChaos(SERVICES.PRICE, CHAOS_SCENARIOS.ERROR_500);
    }

    const request = getRandomRequest();
    const res = makeRequest(request);

    check(res, {
        'trigger: request handled': (r) => r.status === 200 || r.status >= 500,
    });

    // Check if response indicates degradation (fallback used)
    if (res.status === 200) {
        try {
            const body = JSON.parse(res.body);
            if (body.price === '0.00') {
                // Fallback triggered, likely circuit is open or error handled
            }
        } catch (e) {
            // Ignore
        }
    }
}

// Phase 3: Verify circuit breaker provides fast-fail
export function verifyCircuitOpen() {
    const request = getRandomRequest();
    const start = Date.now();
    const res = makeRequest(request);
    const duration = Date.now() - start;

    responseTime.add(duration);

    const isCircuitOpen = check(res, {
        'verify_open: fast response (circuit open)': (r) => r.timings.duration < 100,
        'verify_open: handled gracefully': (r) => r.status === 200 || r.status === 503,
    });

    // Check for degraded response (fallback value)
    if (res.status === 200) {
        try {
            const body = JSON.parse(res.body);
            if (body.price === '0.00') {
                circuitOpen.add(1);
            }
        } catch (e) {
            // Ignore
        }
    }
}

// Phase 4: Heal the service
export function healService() {
    if (__ITER === 0) {
        console.log('Healing service - disabling chaos...');
        disableChaos(SERVICES.PRICE);
    }

    // Make a few requests to allow half-open transition
    const request = getRandomRequest();
    const res = makeRequest(request);

    check(res, {
        'heal: request made': (r) => r.status !== undefined,
    });

    sleep(1);
}

// Phase 5: Verify circuit breaker recovery
export function verifyRecovery(data) {
    const request = getRandomRequest();
    const res = makeRequest(request);

    const success = check(res, {
        'recovery: status is 200': (r) => r.status === 200,
        'recovery: normal response': (r) => {
            if (r.status !== 200) return false;
            try {
                const body = JSON.parse(r.body);
                // Price should be back to normal (not "0.00")
                return body.price !== '0.00';
            } catch (e) {
                return false;
            }
        },
    });

    if (success) {
        normalResponses.add(1);
    }
}

export function teardown() {
    console.log('Cleaning up...');
    resetAllChaos();
    console.log('Circuit breaker test complete');
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
        { headers, timeout: '5s' }
    );
}
