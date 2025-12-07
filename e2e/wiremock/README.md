# WireMock Mappings

Mock definitions for external services used in development, E2E tests, and performance tests.

## Directory Structure

```
wiremock/
└── mappings/
    ├── merchandise.json          # Product catalog service
    ├── price.json                # Pricing service
    ├── inventory.json            # Inventory service
    ├── catalog-search.json       # Catalog search API
    ├── catalog-suggestions.json  # Search suggestions
    ├── oauth/                    # OAuth provider mocks
    │   └── jwks.json             # JWKS endpoint
    ├── downstream-oauth/         # Downstream OAuth (service-to-service)
    │   ├── token.json            # Token endpoint
    │   └── token-chaos.json      # Chaos variant (failures/delays)
    └── fake-auth/                # Development auth (no real OAuth)
        ├── token.json            # Fake token endpoint
        └── jwks.json             # Fake JWKS
```

## Usage

### Docker Compose (Default)

WireMock runs automatically as part of the Docker stack:

```bash
cd docker && docker compose up -d wiremock
```

Mappings are mounted at `/home/wiremock/mappings` inside the container.

### Accessing WireMock

- **Stub endpoint**: http://localhost:8082
- **Admin API**: http://localhost:8082/__admin

```bash
# List all mappings
curl http://localhost:8082/__admin/mappings

# Check WireMock status
curl http://localhost:8082/__admin/health
```

## Mapping Conventions

### File Naming

| Pattern | Usage |
|---------|-------|
| `{service}.json` | Normal service mock |
| `{service}-chaos.json` | Chaos variant (failures, delays) |
| `{provider}/` | Directory for multi-endpoint providers |

### Scenario States

Mappings use WireMock scenarios to simulate different states:

```json
{
  "scenarioName": "merchandise-chaos",
  "requiredScenarioState": "Started",
  "response": { "status": 200 }
}
```

Available scenario states:
- `Started` - Normal operation (default)
- `error-500` - Internal server error
- `error-503` - Service unavailable
- `slow` - High latency responses
- `timeout` - Request timeout

### Changing Scenario State

Use the admin API to trigger chaos:

```bash
# Trigger 500 errors for merchandise
curl -X PUT "http://localhost:8082/__admin/scenarios/merchandise-chaos/state" \
  -H "Content-Type: application/json" \
  -d '{"state": "error-500"}'

# Reset to normal
curl -X PUT "http://localhost:8082/__admin/scenarios/merchandise-chaos/state" \
  -H "Content-Type: application/json" \
  -d '{"state": "Started"}'

# Reset all scenarios
curl -X POST "http://localhost:8082/__admin/scenarios/reset"
```

## Mapping Reference

### merchandise.json

Mocks the merchandise service for product descriptions.

| Endpoint | Response |
|----------|----------|
| `GET /merchandise/{sku}` | Product description JSON |

**Chaos states**: `error-500`, `error-503`, `slow`

### price.json

Mocks the pricing service.

| Endpoint | Response |
|----------|----------|
| `GET /price/{sku}` | Price and currency JSON |

**Chaos states**: `error-500`, `slow`

### inventory.json

Mocks the inventory service for stock levels.

| Endpoint | Response |
|----------|----------|
| `GET /inventory/{sku}` | Stock quantity JSON |

**Chaos states**: `error-500`, `out-of-stock`

### catalog-search.json

Mocks the catalog search API.

| Endpoint | Response |
|----------|----------|
| `GET /catalog/search?q={query}` | Search results array |

### oauth/jwks.json

JWKS endpoint for JWT validation.

| Endpoint | Response |
|----------|----------|
| `GET /.well-known/jwks.json` | JWKS key set |

### fake-auth/

Development-only auth mocks. Returns pre-generated tokens without validation.

| Endpoint | Response |
|----------|----------|
| `POST /oauth/token` | Access token |
| `GET /.well-known/jwks.json` | JWKS for fake tokens |

## Adding New Mappings

### 1. Create Mapping File

```json
{
  "mappings": [
    {
      "name": "my-service-success",
      "priority": 10,
      "scenarioName": "my-service-chaos",
      "requiredScenarioState": "Started",
      "request": {
        "method": "GET",
        "urlPathPattern": "/my-service/.*"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "data": "example"
        }
      }
    }
  ]
}
```

### 2. Add Chaos Variants (Optional)

```json
{
  "name": "my-service-error",
  "priority": 5,
  "scenarioName": "my-service-chaos",
  "requiredScenarioState": "error-500",
  "request": {
    "method": "GET",
    "urlPathPattern": "/my-service/.*"
  },
  "response": {
    "status": 500,
    "body": "Internal Server Error"
  }
}
```

### 3. Restart WireMock

```bash
docker compose restart wiremock
```

Or use hot reload:

```bash
curl -X POST http://localhost:8082/__admin/mappings/reset
```

## Response Templating

WireMock supports response templating for dynamic responses:

```json
{
  "response": {
    "jsonBody": {
      "sku": "{{request.pathSegments.[1]}}",
      "timestamp": "{{now}}"
    },
    "transformers": ["response-template"]
  }
}
```

Note: Requires `--global-response-templating` flag (enabled in docker-compose.yml).

## Related

- [WireMock Documentation](https://wiremock.org/docs/)
- [k6 Performance Tests](../k6/)
- [Backend E2E Testing Standard](../../docs/standards/backend/testing-e2e.md)
