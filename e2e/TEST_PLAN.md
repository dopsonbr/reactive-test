# Performance Test Plan

## Overview

Validate that request metadata propagates correctly through reactive chains under load (10k requests).

## File Structure

```
e2e/
├── TEST_PLAN.md
├── package.json
├── config.json               # Test configuration (VUs, iterations, etc.)
├── src/
│   ├── index.js              # Main orchestrator
│   ├── generate-input.js     # Generates test-input.json
│   ├── validate-logs.js      # Parses and validates logs
│   └── utils/
│       └── metadata.js       # Metadata generation helpers
├── k6/
│   ├── load-test.js          # k6 load test script
│   ├── resilience-test.js    # Multi-phase chaos test
│   ├── circuit-breaker-test.js # Circuit breaker validation
│   └── chaos-controller.js   # WireMock chaos control helpers
├── wiremock/
│   └── mappings/             # WireMock stub definitions with chaos scenarios
│       ├── merchandise.json
│       ├── price.json
│       └── inventory.json
├── data/
│   └── test-input.json       # Generated: 10k request metadata
└── output/
    └── results.json          # Validation results

# At project root:
logs/
└── application.log           # App writes JSON logs here
```

## Configuration

**File: `config.json`**
```json
{
  "k6": {
    "vus": 50,
    "iterations": 10000,
    "maxDuration": "10m"
  },
  "wiremock": {
    "port": 8081,
    "jarPath": "./wiremock/wiremock.jar"
  },
  "app": {
    "port": 8080,
    "logFile": "../logs/application.log"
  }
}
```

VUs can be overridden via CLI: `npm test -- --vus=25`

## Phase 1: Generate Test Input

Generate 10k unique request metadata sets upfront.

**File: `data/test-input.json`**
```json
{
  "requests": [
    {
      "id": 0,
      "sku": 123456,
      "metadata": {
        "storeNumber": 1542,
        "orderNumber": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "abc123",
        "sessionId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
      }
    },
    // ... 9,999 more
  ]
}
```

**Generation rules:**
- `id`: Sequential 0-9999 (for correlation)
- `sku`: Random 6-digit number
- `storeNumber`: Random integer 1-2000
- `orderNumber`: UUID v4
- `userId`: Random 6 alphanumeric characters
- `sessionId`: UUID v4

## Phase 2: WireMock Setup

Start WireMock standalone with stubs that return responses with random latency (15-75ms).

**Stub: `wiremock/mappings/merchandise.json`**
```json
{
  "request": {
    "method": "GET",
    "urlPathPattern": "/merchandise/.*"
  },
  "response": {
    "status": 200,
    "headers": { "Content-Type": "application/json" },
    "jsonBody": { "description": "Test Product Description" },
    "delayDistribution": {
      "type": "uniform",
      "lower": 15,
      "upper": 75
    }
  }
}
```

**Stub: `wiremock/mappings/price.json`**
```json
{
  "request": {
    "method": "POST",
    "urlPath": "/price"
  },
  "response": {
    "status": 200,
    "headers": { "Content-Type": "application/json" },
    "jsonBody": { "price": "99.99" },
    "delayDistribution": {
      "type": "uniform",
      "lower": 15,
      "upper": 75
    }
  }
}
```

**Stub: `wiremock/mappings/inventory.json`**
```json
{
  "request": {
    "method": "POST",
    "urlPath": "/inventory"
  },
  "response": {
    "status": 200,
    "headers": { "Content-Type": "application/json" },
    "jsonBody": { "availableQuantity": 100 },
    "delayDistribution": {
      "type": "uniform",
      "lower": 15,
      "upper": 75
    }
  }
}
```

## Phase 3: k6 Load Test

k6 reads from `test-input.json` and sends requests with pre-generated metadata.

**File: `k6/load-test.js`**
```javascript
import http from 'k6/http';
import { SharedArray } from 'k6/data';

const testData = new SharedArray('requests', function() {
  return JSON.parse(open('../data/test-input.json')).requests;
});

export const options = {
  scenarios: {
    load_test: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 10000,
      maxDuration: '10m',
    },
  },
};

export default function() {
  const request = testData[__ITER];

  const headers = {
    'Content-Type': 'application/json',
    'x-store-number': String(request.metadata.storeNumber),
    'x-order-number': request.metadata.orderNumber,
    'x-userid': request.metadata.userId,
    'x-sessionid': request.metadata.sessionId,
  };

  http.get(`http://localhost:8080/products/${request.sku}`, { headers });
}
```

## Phase 4: Log Validation

Parse application logs and validate metadata consistency.

### Expected Logs Per Request

Each request should generate these log entries (minimum 8):

| Logger | Type | Count |
|--------|------|-------|
| productscontroller | request | 1 |
| productscontroller | response | 1 |
| productservice | message | 1+ |
| merchandiserepository | request | 1 |
| merchandiserepository | response | 1 |
| pricerepository | request | 1 |
| pricerepository | response | 1 |
| inventoryrepository | request | 1 |
| inventoryrepository | response | 1 |

### Validation Algorithm

```
1. Parse app.log (JSON lines)
2. Group logs by orderNumber (unique identifier)
3. For each orderNumber:
   a. Lookup expected metadata from test-input.json
   b. Verify ALL log entries have matching:
      - storeNumber
      - orderNumber
      - userId
      - sessionId
   c. Verify minimum log count (8+ entries)
   d. Record any mismatches
4. Generate summary report
```

### Validation Checks

| Check | Description | Failure Indicates |
|-------|-------------|-------------------|
| Metadata match | All 4 fields match expected values | Context not set correctly |
| Cross-contamination | No logs have metadata from different request | Context leaking between requests |
| Completeness | All 10k orderNumbers present in logs | Requests lost/failed |
| Log count | Each request has 8+ log entries | Missing logging |

## Phase 5: Orchestration

**Node.js orchestrator (`src/index.js`) workflow:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Generate test-input.json (10k requests)                  │
├─────────────────────────────────────────────────────────────┤
│ 2. Clear previous log file (logs/application.log)           │
├─────────────────────────────────────────────────────────────┤
│ 3. Start WireMock standalone JAR                            │
│    └─ java -jar wiremock.jar --port 8081                    │
│    └─ Wait for health check: GET /__admin/mappings          │
├─────────────────────────────────────────────────────────────┤
│ 4. Start Spring Boot app                                    │
│    └─ ./gradlew bootRun (app writes to logs/application.log)│
│    └─ Wait for health check: GET /actuator/health           │
├─────────────────────────────────────────────────────────────┤
│ 5. Run k6 load test                                         │
│    └─ k6 run --vus={config.vus} k6/load-test.js             │
├─────────────────────────────────────────────────────────────┤
│ 6. Stop Spring Boot app (SIGTERM)                           │
├─────────────────────────────────────────────────────────────┤
│ 7. Stop WireMock (SIGTERM)                                  │
├─────────────────────────────────────────────────────────────┤
│ 8. Validate logs                                            │
│    └─ Parse logs/application.log                            │
│    └─ Compare against test-input.json                       │
│    └─ Generate output/results.json                          │
├─────────────────────────────────────────────────────────────┤
│ 9. Print summary & exit code                                │
│    └─ Exit 0 if all validations pass                        │
│    └─ Exit 1 if any failures                                │
└─────────────────────────────────────────────────────────────┘
```

## Output: results.json

```json
{
  "summary": {
    "totalRequests": 10000,
    "validatedRequests": 10000,
    "passedRequests": 10000,
    "failedRequests": 0,
    "missingRequests": 0,
    "crossContaminationCount": 0
  },
  "failures": [
    {
      "orderNumber": "abc-123",
      "expected": {
        "storeNumber": 1234,
        "orderNumber": "abc-123",
        "userId": "foo124",
        "sessionId": "xyz-789"
      },
      "actual": {
        "storeNumber": 5678,
        "orderNumber": "abc-123",
        "userId": "foo124",
        "sessionId": "xyz-789"
      },
      "logger": "pricerepository",
      "logIndex": 45023
    }
  ],
  "timing": {
    "generateInputMs": 150,
    "wiremockStartMs": 2000,
    "appStartMs": 5000,
    "k6DurationMs": 120000,
    "validationMs": 3000,
    "totalMs": 130150
  }
}
```

## CLI Usage

```bash
# Install dependencies
cd e2e-test && npm install

# Run full test
npm test

# Individual phases
npm run generate    # Generate test-input.json only
npm run validate    # Validate existing logs only
```

## Docker Compose Test Commands

```bash
# Start stack and run load test (product-service)
cd docker && docker compose up -d
docker compose --profile test-product up k6-product

# Run chaos/resilience tests (product-service)
docker compose --profile chaos-product up k6-product-resilience
docker compose --profile chaos-product run k6-product-circuit-breaker

# Stop everything
docker compose --profile test-product --profile chaos-product down -v
```

## Prerequisites

- Node.js 24.x (required, see .nvmrc)
- k6 installed (`brew install k6` or equivalent)
- WireMock standalone JAR
- Java 25 (for Spring Boot app)