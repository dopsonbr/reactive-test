# 012: Product Search Testing & Infrastructure

**Status: DRAFT**

**Related Plans:**
- **011_PRODUCT_SEARCH_API** - Core search API implementation (prerequisite)

---

## Overview

This plan provides the testing infrastructure, WireMock stubs, and e2e tests for the product search functionality implemented in 011_PRODUCT_SEARCH_API.

## Goals

1. Create WireMock stubs for catalog service
2. Implement unit tests for validation
3. Implement controller tests
4. Implement integration tests with Testcontainers
5. Implement k6 e2e load tests
6. Document security requirements

## References

**Standards:**
- `docs/standards/testing-unit.md` - Unit test patterns
- `docs/standards/testing-integration.md` - Testcontainers, WireMock
- `docs/standards/testing-e2e.md` - k6 patterns

---

## Phase 1: WireMock Stubs

### 1.1 Catalog Search Stub

**New File:** `docker/wiremock/mappings/catalog-search.json`

```json
{
  "mappings": [
    {
      "name": "Catalog Search - Default",
      "request": {
        "method": "POST",
        "urlPath": "/catalog/search"
      },
      "response": {
        "status": 200,
        "headers": { "Content-Type": "application/json" },
        "jsonBody": {
          "products": [
            {
              "sku": 123456,
              "description": "Laptop Computer - 15 inch",
              "price": 999.99,
              "availableQuantity": 50,
              "category": "Electronics",
              "relevanceScore": 0.95
            },
            {
              "sku": 234567,
              "description": "Laptop Bag - Professional",
              "price": 49.99,
              "availableQuantity": 200,
              "category": "Accessories",
              "relevanceScore": 0.85
            },
            {
              "sku": 345678,
              "description": "Laptop Stand - Adjustable",
              "price": 79.99,
              "availableQuantity": 75,
              "category": "Accessories",
              "relevanceScore": 0.80
            }
          ],
          "totalCount": 3,
          "totalPages": 1,
          "page": 0,
          "size": 20,
          "query": "laptop",
          "searchTimeMs": 45
        }
      }
    },
    {
      "name": "Catalog Search - No Results",
      "request": {
        "method": "POST",
        "urlPath": "/catalog/search",
        "bodyPatterns": [{ "matchesJsonPath": { "expression": "$.query", "contains": "nonexistent" }}]
      },
      "response": {
        "status": 200,
        "headers": { "Content-Type": "application/json" },
        "jsonBody": {
          "products": [],
          "totalCount": 0,
          "totalPages": 0,
          "page": 0,
          "size": 20,
          "query": "nonexistent",
          "searchTimeMs": 12
        }
      }
    }
  ]
}
```

### 1.2 Catalog Suggestions Stub

**New File:** `docker/wiremock/mappings/catalog-suggestions.json`

```json
{
  "mappings": [
    {
      "name": "Catalog Suggestions",
      "request": {
        "method": "GET",
        "urlPathPattern": "/catalog/suggestions.*"
      },
      "response": {
        "status": 200,
        "headers": { "Content-Type": "application/json" },
        "jsonBody": {
          "suggestions": ["laptop", "laptop bag", "laptop stand", "laptop charger", "laptop sleeve"]
        }
      }
    }
  ]
}
```

### 1.3 Catalog Chaos Stubs

**New File:** `docker/wiremock/mappings/catalog-chaos.json`

```json
{
  "mappings": [
    {
      "name": "Catalog Search - Timeout",
      "scenarioName": "catalog-chaos",
      "requiredScenarioState": "timeout",
      "request": { "method": "POST", "urlPath": "/catalog/search" },
      "response": {
        "status": 200,
        "fixedDelayMilliseconds": 5000,
        "headers": { "Content-Type": "application/json" },
        "jsonBody": { "products": [], "totalCount": 0, "totalPages": 0, "page": 0, "size": 20, "query": "", "searchTimeMs": 5000 }
      }
    },
    {
      "name": "Catalog Search - 500 Error",
      "scenarioName": "catalog-chaos",
      "requiredScenarioState": "error-500",
      "request": { "method": "POST", "urlPath": "/catalog/search" },
      "response": {
        "status": 500,
        "headers": { "Content-Type": "application/json" },
        "jsonBody": { "error": "Internal Server Error", "message": "Catalog service unavailable" }
      }
    },
    {
      "name": "Catalog Search - 503 Service Unavailable",
      "scenarioName": "catalog-chaos",
      "requiredScenarioState": "error-503",
      "request": { "method": "POST", "urlPath": "/catalog/search" },
      "response": {
        "status": 503,
        "headers": { "Content-Type": "application/json", "Retry-After": "5" },
        "jsonBody": { "error": "Service Unavailable", "message": "Catalog service is temporarily unavailable" }
      }
    }
  ]
}
```

---

## Phase 2: Unit Tests

### 2.1 SearchRequestValidatorTest

**New File:** `apps/product-service/src/test/java/org/example/product/validation/SearchRequestValidatorTest.java`

```java
package org.example.product.validation;

import org.example.platform.error.ValidationException;
import org.example.product.domain.SearchCriteria;
import org.example.product.domain.SortDirection;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;
import java.math.BigDecimal;
import java.util.Optional;

class SearchRequestValidatorTest {

    private SearchRequestValidator validator;

    @BeforeEach
    void setUp() {
        validator = new SearchRequestValidator();
    }

    @Test
    void shouldAcceptValidSearchCriteria() {
        SearchCriteria criteria = new SearchCriteria("laptop",
            Optional.of(new BigDecimal("100")), Optional.of(new BigDecimal("500")),
            Optional.empty(), Optional.empty(), Optional.empty(),
            Optional.of("12345"), Optional.of("100"),
            "price", SortDirection.ASC, 0, 20);

        StepVerifier.create(validator.validate(criteria)).verifyComplete();
    }

    @Test
    void shouldRejectEmptyQuery() {
        SearchCriteria criteria = new SearchCriteria("",
            Optional.empty(), Optional.empty(), Optional.empty(), Optional.empty(),
            Optional.empty(), Optional.empty(), Optional.empty(),
            "relevance", SortDirection.DESC, 0, 20);

        StepVerifier.create(validator.validate(criteria))
            .expectError(ValidationException.class).verify();
    }

    @Test
    void shouldRejectQueryTooShort() {
        SearchCriteria criteria = new SearchCriteria("a",
            Optional.empty(), Optional.empty(), Optional.empty(), Optional.empty(),
            Optional.empty(), Optional.empty(), Optional.empty(),
            "relevance", SortDirection.DESC, 0, 20);

        StepVerifier.create(validator.validate(criteria))
            .expectError(ValidationException.class).verify();
    }

    @Test
    void shouldRejectMinPriceGreaterThanMaxPrice() {
        SearchCriteria criteria = new SearchCriteria("laptop",
            Optional.of(new BigDecimal("500")), Optional.of(new BigDecimal("100")),
            Optional.empty(), Optional.empty(), Optional.empty(),
            Optional.empty(), Optional.empty(),
            "price", SortDirection.ASC, 0, 20);

        StepVerifier.create(validator.validate(criteria))
            .expectError(ValidationException.class).verify();
    }

    @Test
    void shouldRejectNegativePrice() {
        SearchCriteria criteria = new SearchCriteria("laptop",
            Optional.of(new BigDecimal("-10")), Optional.empty(),
            Optional.empty(), Optional.empty(), Optional.empty(),
            Optional.empty(), Optional.empty(),
            "price", SortDirection.ASC, 0, 20);

        StepVerifier.create(validator.validate(criteria))
            .expectError(ValidationException.class).verify();
    }

    @Test
    void shouldRejectInvalidSortField() {
        SearchCriteria criteria = new SearchCriteria("laptop",
            Optional.empty(), Optional.empty(), Optional.empty(), Optional.empty(),
            Optional.empty(), Optional.empty(), Optional.empty(),
            "invalid_field", SortDirection.DESC, 0, 20);

        StepVerifier.create(validator.validate(criteria))
            .expectError(ValidationException.class).verify();
    }

    @Test
    void shouldRejectInvalidZipCode() {
        SearchCriteria criteria = new SearchCriteria("laptop",
            Optional.empty(), Optional.empty(), Optional.empty(), Optional.empty(),
            Optional.empty(), Optional.of("invalid"), Optional.empty(),
            "relevance", SortDirection.DESC, 0, 20);

        StepVerifier.create(validator.validate(criteria))
            .expectError(ValidationException.class).verify();
    }

    @Test
    void shouldAcceptValidZipCodeFormats() {
        // 5-digit
        SearchCriteria c5 = new SearchCriteria("laptop",
            Optional.empty(), Optional.empty(), Optional.empty(), Optional.empty(),
            Optional.empty(), Optional.of("12345"), Optional.empty(),
            "relevance", SortDirection.DESC, 0, 20);
        StepVerifier.create(validator.validate(c5)).verifyComplete();

        // 5+4 format
        SearchCriteria c9 = new SearchCriteria("laptop",
            Optional.empty(), Optional.empty(), Optional.empty(), Optional.empty(),
            Optional.empty(), Optional.of("12345-6789"), Optional.empty(),
            "relevance", SortDirection.DESC, 0, 20);
        StepVerifier.create(validator.validate(c9)).verifyComplete();
    }

    @Test
    void shouldRejectInvalidSellingLocation() {
        SearchCriteria criteria = new SearchCriteria("laptop",
            Optional.empty(), Optional.empty(), Optional.empty(), Optional.empty(),
            Optional.empty(), Optional.empty(), Optional.of("INVALID_LOCATION"),
            "relevance", SortDirection.DESC, 0, 20);

        StepVerifier.create(validator.validate(criteria))
            .expectError(ValidationException.class).verify();
    }

    @Test
    void shouldAcceptValidSellingLocations() {
        // Physical store ID
        SearchCriteria store = new SearchCriteria("laptop",
            Optional.empty(), Optional.empty(), Optional.empty(), Optional.empty(),
            Optional.empty(), Optional.empty(), Optional.of("1234"),
            "relevance", SortDirection.DESC, 0, 20);
        StepVerifier.create(validator.validate(store)).verifyComplete();

        // Virtual: ONLINE
        SearchCriteria online = new SearchCriteria("laptop",
            Optional.empty(), Optional.empty(), Optional.empty(), Optional.empty(),
            Optional.empty(), Optional.empty(), Optional.of("ONLINE"),
            "relevance", SortDirection.DESC, 0, 20);
        StepVerifier.create(validator.validate(online)).verifyComplete();

        // Virtual: MOBILE_APP
        SearchCriteria mobile = new SearchCriteria("laptop",
            Optional.empty(), Optional.empty(), Optional.empty(), Optional.empty(),
            Optional.empty(), Optional.empty(), Optional.of("MOBILE_APP"),
            "relevance", SortDirection.DESC, 0, 20);
        StepVerifier.create(validator.validate(mobile)).verifyComplete();
    }
}
```

---

## Phase 3: Controller Tests

**New File:** `apps/product-service/src/test/java/org/example/product/controller/ProductSearchControllerTest.java`

```java
package org.example.product.controller;

import org.example.product.domain.SearchProduct;
import org.example.product.domain.SearchResponse;
import org.example.product.service.ProductSearchService;
import org.example.product.validation.SearchRequestValidator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;
import java.math.BigDecimal;
import java.util.List;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@WebFluxTest(ProductSearchController.class)
class ProductSearchControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private ProductSearchService searchService;

    @MockBean
    private SearchRequestValidator validator;

    private static final String STORE_HEADER = "x-store-number";
    private static final String ORDER_HEADER = "x-order-number";
    private static final String USER_HEADER = "x-userid";
    private static final String SESSION_HEADER = "x-sessionid";

    @Test
    void shouldReturnSearchResults() {
        SearchProduct product = new SearchProduct(123456L, "Laptop Computer",
            new BigDecimal("999.99"), 50, "Electronics", 0.95);
        SearchResponse<SearchProduct> response = new SearchResponse<>(
            List.of(product), 1L, 1, 0, 20, "laptop", 45L);

        when(validator.validate(any())).thenReturn(Mono.empty());
        when(searchService.search(any())).thenReturn(Mono.just(response));

        webTestClient.get()
            .uri("/products/search?q=laptop")
            .header(STORE_HEADER, "100")
            .header(ORDER_HEADER, "550e8400-e29b-41d4-a716-446655440000")
            .header(USER_HEADER, "user01")
            .header(SESSION_HEADER, "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.totalItems").isEqualTo(1)
            .jsonPath("$.items[0].sku").isEqualTo(123456)
            .jsonPath("$.items[0].description").isEqualTo("Laptop Computer");
    }

    @Test
    void shouldReturnSuggestions() {
        List<String> suggestions = List.of("laptop", "laptop bag", "laptop stand");
        when(searchService.getSuggestions(any(), any())).thenReturn(Mono.just(suggestions));

        webTestClient.get()
            .uri("/products/search/suggestions?prefix=lap")
            .header(STORE_HEADER, "100")
            .header(ORDER_HEADER, "550e8400-e29b-41d4-a716-446655440000")
            .header(USER_HEADER, "user01")
            .header(SESSION_HEADER, "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$[0]").isEqualTo("laptop")
            .jsonPath("$[1]").isEqualTo("laptop bag");
    }

    @Test
    void shouldReturn400ForMissingQuery() {
        webTestClient.get()
            .uri("/products/search")
            .header(STORE_HEADER, "100")
            .header(ORDER_HEADER, "550e8400-e29b-41d4-a716-446655440000")
            .header(USER_HEADER, "user01")
            .header(SESSION_HEADER, "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isBadRequest();
    }

    @Test
    void shouldAcceptLocationParameters() {
        SearchProduct product = new SearchProduct(123456L, "Laptop",
            new BigDecimal("999.99"), 50, "Electronics", 0.95);
        SearchResponse<SearchProduct> response = new SearchResponse<>(
            List.of(product), 1L, 1, 0, 20, "laptop", 45L);

        when(validator.validate(any())).thenReturn(Mono.empty());
        when(searchService.search(any())).thenReturn(Mono.just(response));

        webTestClient.get()
            .uri("/products/search?q=laptop&customerZipCode=12345&sellingLocation=ONLINE")
            .header(STORE_HEADER, "100")
            .header(ORDER_HEADER, "550e8400-e29b-41d4-a716-446655440000")
            .header(USER_HEADER, "user01")
            .header(SESSION_HEADER, "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isOk();
    }
}
```

---

## Phase 4: Integration Tests

**New File:** `apps/product-service/src/test/java/org/example/product/integration/ProductSearchIntegrationTest.java`

```java
package org.example.product.integration;

import com.github.tomakehurst.wiremock.WireMockServer;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import static com.github.tomakehurst.wiremock.client.WireMock.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class ProductSearchIntegrationTest {

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    private static WireMockServer wireMockServer;

    @Autowired
    private WebTestClient webTestClient;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        wireMockServer = new WireMockServer(0);
        wireMockServer.start();
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
        registry.add("app.services.catalog.base-url", wireMockServer::baseUrl);
        registry.add("app.services.merchandise.base-url", wireMockServer::baseUrl);
        registry.add("app.services.price.base-url", wireMockServer::baseUrl);
        registry.add("app.services.inventory.base-url", wireMockServer::baseUrl);
    }

    @BeforeEach
    void setUp() {
        wireMockServer.resetAll();
        setupCatalogMocks();
    }

    @AfterEach
    void tearDown() {
        wireMockServer.stop();
    }

    @Test
    void shouldSearchProductsSuccessfully() {
        webTestClient.get()
            .uri("/products/search?q=laptop")
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.totalItems").isEqualTo(3)
            .jsonPath("$.query").isEqualTo("laptop");
    }

    @Test
    void shouldReturnEmptyResultsForNoMatches() {
        webTestClient.get()
            .uri("/products/search?q=nonexistent")
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.totalItems").isEqualTo(0)
            .jsonPath("$.items").isEmpty();
    }

    @Test
    void shouldFilterByPriceRange() {
        webTestClient.get()
            .uri("/products/search?q=laptop&minPrice=50&maxPrice=100")
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isOk();

        wireMockServer.verify(postRequestedFor(urlPathEqualTo("/catalog/search"))
            .withRequestBody(matchingJsonPath("$.minPrice", equalTo("50")))
            .withRequestBody(matchingJsonPath("$.maxPrice", equalTo("100"))));
    }

    private void setupCatalogMocks() {
        wireMockServer.stubFor(post(urlPathEqualTo("/catalog/search"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {"products":[
                      {"sku":123456,"description":"Laptop Computer","price":999.99,"availableQuantity":50,"category":"Electronics","relevanceScore":0.95},
                      {"sku":234567,"description":"Laptop Bag","price":49.99,"availableQuantity":200,"category":"Accessories","relevanceScore":0.85},
                      {"sku":345678,"description":"Laptop Stand","price":79.99,"availableQuantity":75,"category":"Accessories","relevanceScore":0.80}
                    ],"totalCount":3,"totalPages":1,"page":0,"size":20,"query":"laptop","searchTimeMs":45}
                    """)));

        wireMockServer.stubFor(post(urlPathEqualTo("/catalog/search"))
            .withRequestBody(matchingJsonPath("$.query", containing("nonexistent")))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {"products":[],"totalCount":0,"totalPages":0,"page":0,"size":20,"query":"nonexistent","searchTimeMs":12}
                    """)));

        wireMockServer.stubFor(get(urlPathMatching("/catalog/suggestions.*"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {"suggestions":["laptop","laptop bag","laptop stand","laptop charger"]}
                    """)));
    }
}
```

---

## Phase 5: E2E Tests (k6)

**New File:** `e2e-test/k6/product-search-test.js`

```javascript
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
            'search has items': (r) => JSON.parse(r.body).items !== undefined,
            'search has pagination': (r) => {
                const body = JSON.parse(r.body);
                return body.totalItems !== undefined && body.totalPages !== undefined;
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
            'suggestions is array': (r) => Array.isArray(JSON.parse(r.body))
        });
    });
    sleep(0.2);
}
```

---

## Phase 6: Security

If OAuth2 security is enabled (per `docs/standards/security.md`), the search endpoints require authorization:

| Endpoint | Required Scope |
|----------|----------------|
| GET /products/search | `product:read` |
| GET /products/search/suggestions | `product:read` |

Apply the existing `@PreAuthorize("hasAuthority('SCOPE_product:read')")` pattern.

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `docker/wiremock/mappings/catalog-search.json` | WireMock search stub |
| CREATE | `docker/wiremock/mappings/catalog-suggestions.json` | WireMock suggestions stub |
| CREATE | `docker/wiremock/mappings/catalog-chaos.json` | WireMock chaos stubs |
| CREATE | `test/.../SearchRequestValidatorTest.java` | Validator unit tests |
| CREATE | `test/.../ProductSearchControllerTest.java` | Controller tests |
| CREATE | `test/.../ProductSearchIntegrationTest.java` | Integration tests |
| CREATE | `e2e-test/k6/product-search-test.js` | k6 load tests |

---

## Open Questions

1. **Search Backend**: Start with WireMock stub, design for future Elasticsearch
2. **Search Scope**: Description and category for initial implementation
3. **Faceted Search**: Defer to future enhancement
4. **Search Analytics**: Integrate with audit system (009_AUDIT_DATA)
5. **Rate Limiting**: Consider lower limits for suggestions

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Catalog latency | Aggressive caching (5 min TTL), circuit breaker |
| Cache grows large | Key hashing, max size, shorter TTL |
| Query injection | Sanitize input, parameterized queries |
| Expensive queries | Complexity limits, pagination limits |
| High suggestion volume | Longer TTL (1 hour), rate limiting |

---

## Checklist

- [ ] Phase 1: WireMock stubs created
- [ ] Phase 2: Unit tests passing
- [ ] Phase 3: Controller tests passing
- [ ] Phase 4: Integration tests passing
- [ ] Phase 5: k6 tests configured
- [ ] Phase 6: Security documented
- [ ] All tests green
