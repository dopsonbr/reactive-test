import http from 'k6/http';

const WIREMOCK_URL = __ENV.WIREMOCK_URL || 'http://localhost:8081';

/**
 * Enable a chaos scenario for a service.
 * @param {string} service - The service name (price, merchandise, inventory)
 * @param {string} scenario - The scenario state (error-500, error-503, timeout, slow)
 */
export function enableChaos(service, scenario) {
    const url = `${WIREMOCK_URL}/__admin/scenarios/${service}-chaos/state`;
    const payload = JSON.stringify({ state: scenario });
    const params = {
        headers: { 'Content-Type': 'application/json' },
    };

    const res = http.put(url, payload, params);
    if (res.status !== 200) {
        console.warn(`Failed to enable chaos for ${service}: ${res.status}`);
    }
}

/**
 * Disable chaos for a service (reset to normal operation).
 * @param {string} service - The service name (price, merchandise, inventory)
 */
export function disableChaos(service) {
    enableChaos(service, 'Started');
}

/**
 * Reset all chaos scenarios to normal operation.
 */
export function resetAllChaos() {
    disableChaos('price');
    disableChaos('merchandise');
    disableChaos('inventory');
}

/**
 * Enable multiple chaos scenarios at once.
 * @param {Object} scenarios - Map of service to scenario state
 * Example: { price: 'error-500', merchandise: 'timeout' }
 */
export function enableMultipleChaos(scenarios) {
    for (const [service, scenario] of Object.entries(scenarios)) {
        enableChaos(service, scenario);
    }
}

/**
 * Get current scenario states for all services.
 * @returns {Object} Map of service to current state
 */
export function getScenarioStates() {
    const url = `${WIREMOCK_URL}/__admin/scenarios`;
    const res = http.get(url);

    if (res.status !== 200) {
        console.warn(`Failed to get scenario states: ${res.status}`);
        return {};
    }

    try {
        const data = JSON.parse(res.body);
        const states = {};
        for (const scenario of data.scenarios || []) {
            states[scenario.name] = scenario.state;
        }
        return states;
    } catch (e) {
        console.warn(`Failed to parse scenario states: ${e}`);
        return {};
    }
}

// Chaos scenario constants
export const CHAOS_SCENARIOS = {
    ERROR_500: 'error-500',
    ERROR_503: 'error-503',
    TIMEOUT: 'timeout',
    SLOW: 'slow',
    NORMAL: 'Started',
};

export const SERVICES = {
    PRICE: 'price',
    MERCHANDISE: 'merchandise',
    INVENTORY: 'inventory',
};
