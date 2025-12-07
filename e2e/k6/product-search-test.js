import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const searchLatency = new Trend('search_latency');
const suggestionLatency = new Trend('suggestion_latency');
const searchErrors = new Rate('search_errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

const SEARCH_QUERIES = ['laptop', 'phone', 'tablet', 'keyboard', 'monitor', 'mouse', 'headphones', 'camera'];
const ZIP_CODES = ['12345', '90210', '10001', '33139', '94102'];
const SELLING_LOCATIONS = ['100', '200', '500', 'ONLINE', 'MOBILE_APP'];

const HEADERS = {
    'x-store-number': '100',
    'x-order-number': '550e8400-e29b-41d4-a716-446655440000',
    'x-userid': 'user01',
    'x-sessionid': '550e8400-e29b-41d4-a716-446655440000'
};

export const options = {
    scenarios: {
        search_steady: {
            executor: 'constant-vus',
            vus: 10,
            duration: '2m',
            tags: { scenario: 'search_steady' }
        },
        search_ramp: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 20 },
                { duration: '1m', target: 20 },
                { duration: '30s', target: 50 },
                { duration: '1m', target: 50 },
                { duration: '30s', target: 0 }
            ],
            startTime: '2m',
            tags: { scenario: 'search_ramp' }
        },
        suggestions: {
            executor: 'constant-vus',
            vus: 5,
            duration: '5m',
            exec: 'suggestionTest',
            tags: { scenario: 'suggestions' }
        }
    },
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'],
        search_latency: ['p(95)<400'],
        suggestion_latency: ['p(95)<200'],
        search_errors: ['rate<0.01']
    }
};

export default function() {
    group('Product Search', () => {
        const query = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
        const page = Math.floor(Math.random() * 3);
        const size = [10, 20, 50][Math.floor(Math.random() * 3)];
        const zipCode = ZIP_CODES[Math.floor(Math.random() * ZIP_CODES.length)];
        const sellingLocation = SELLING_LOCATIONS[Math.floor(Math.random() * SELLING_LOCATIONS.length)];

        const url = `${BASE_URL}/products/search?q=${query}&page=${page}&size=${size}&customerZipCode=${zipCode}&sellingLocation=${sellingLocation}`;
        const startTime = Date.now();
        const response = http.get(url, { headers: HEADERS });
        searchLatency.add(Date.now() - startTime);

        const success = check(response, {
            'search status is 200': (r) => r.status === 200,
            'search has items': (r) => {
                try {
                    return JSON.parse(r.body).items !== undefined;
                } catch (e) {
                    return false;
                }
            },
            'search has pagination': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.totalItems !== undefined && body.totalPages !== undefined;
                } catch (e) {
                    return false;
                }
            }
        });

        searchErrors.add(success ? 0 : 1);
    });
    sleep(0.5);
}

export function suggestionTest() {
    group('Search Suggestions', () => {
        const prefixes = ['lap', 'pho', 'tab', 'key', 'mon'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

        const url = `${BASE_URL}/products/search/suggestions?prefix=${prefix}`;
        const startTime = Date.now();
        const response = http.get(url, { headers: HEADERS });
        suggestionLatency.add(Date.now() - startTime);

        check(response, {
            'suggestions status is 200': (r) => r.status === 200,
            'suggestions is array': (r) => {
                try {
                    return Array.isArray(JSON.parse(r.body));
                } catch (e) {
                    return false;
                }
            }
        });
    });
    sleep(0.2);
}
