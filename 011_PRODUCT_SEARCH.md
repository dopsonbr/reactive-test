# 011: Product Search Implementation Plan

## Overview

This plan adds search endpoints to the product-service, enabling clients to search for products by various criteria. The implementation includes full-text search, filtering, pagination, and sorting capabilities using reactive patterns.

## Goals

1. Add search endpoints to product-service for finding products by description, price range, and availability
2. Implement pagination and sorting for search results
3. Add caching for search results with appropriate TTL
4. Apply resilience patterns for search operations
5. Maintain consistency with existing platform patterns (logging, error handling, validation)

## Current State

### Existing Product Service

The product-service currently provides a single endpoint:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/products/{sku}` | Get product by SKU |

**Key Files:**
- `ProductController.java:40-66` - Single GET endpoint for product by SKU
- `ProductService.java` - Aggregates merchandise, price, and inventory data
- `Product.java` - Domain record: `(sku, description, price, availableQuantity)`

### External Services

The product-service aggregates data from three external services:
- **Merchandise Service** - Product descriptions
- **Price Service** - Product pricing
- **Inventory Service** - Product availability

**Note:** Search functionality will require a new **Catalog Service** or search index (e.g., Elasticsearch) since the existing services are designed for single-item lookups, not bulk search operations.

---

## Target State

### New Search Endpoints

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/products/search` | Search products | `SearchResponse<Product>` |
| GET | `/products/search/suggestions` | Get search suggestions/autocomplete | `List<String>` |

### Search Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    Client Request                                        │
│        GET /products/search?q=laptop&minPrice=100&maxPrice=500&page=0&size=20          │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ProductSearchController                                     │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  1. Extract and validate search parameters                                          │ │
│  │  2. Build SearchCriteria object                                                     │ │
│  │  3. Call ProductSearchService                                                       │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ProductSearchService                                        │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  1. Check Redis cache for search results                                            │ │
│  │  2. If cache miss, call Catalog Service                                             │ │
│  │  3. Apply resilience patterns (circuit breaker, retry, timeout)                     │ │
│  │  4. Cache results with TTL                                                          │ │
│  │  5. Return paginated response                                                       │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              External Catalog Service                                    │
│                    (WireMock stub in dev/test, real service in prod)                    │
│                                                                                          │
│  Endpoints:                                                                              │
│  - POST /catalog/search (search with criteria)                                          │
│  - GET /catalog/suggestions?prefix=lap (autocomplete)                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Domain Models

### 1.1 Search Criteria

**New File:** `apps/product-service/src/main/java/org/example/product/domain/SearchCriteria.java`

```java
package org.example.product.domain;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Criteria for product search operations.
 */
public record SearchCriteria(
    String query,                          // Full-text search query
    Optional<BigDecimal> minPrice,         // Minimum price filter
    Optional<BigDecimal> maxPrice,         // Maximum price filter
    Optional<Integer> minAvailability,     // Minimum available quantity
    Optional<Boolean> inStockOnly,         // Only show in-stock items
    Optional<String> category,             // Category filter
    String sortBy,                         // Field to sort by (relevance, price, availability)
    SortDirection sortDirection,           // ASC or DESC
    int page,                              // Page number (0-based)
    int size                               // Page size
) {
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
    public static final String DEFAULT_SORT = "relevance";

    public SearchCriteria {
        // Validation and defaults
        if (size <= 0) size = DEFAULT_PAGE_SIZE;
        if (size > MAX_PAGE_SIZE) size = MAX_PAGE_SIZE;
        if (page < 0) page = 0;
        if (sortBy == null || sortBy.isBlank()) sortBy = DEFAULT_SORT;
        if (sortDirection == null) sortDirection = SortDirection.DESC;
    }
}
```

### 1.2 Sort Direction Enum

**New File:** `apps/product-service/src/main/java/org/example/product/domain/SortDirection.java`

```java
package org.example.product.domain;

public enum SortDirection {
    ASC, DESC
}
```

### 1.3 Search Response

**New File:** `apps/product-service/src/main/java/org/example/product/domain/SearchResponse.java`

```java
package org.example.product.domain;

import java.util.List;

/**
 * Paginated search response.
 */
public record SearchResponse<T>(
    List<T> items,           // Search results for current page
    long totalItems,         // Total number of matching items
    int totalPages,          // Total number of pages
    int currentPage,         // Current page number (0-based)
    int pageSize,            // Items per page
    String query,            // Original search query
    long searchTimeMs        // Search execution time in milliseconds
) {
    public boolean hasNext() {
        return currentPage < totalPages - 1;
    }

    public boolean hasPrevious() {
        return currentPage > 0;
    }
}
```

### 1.4 Search Product (Extended Product for Search Results)

**New File:** `apps/product-service/src/main/java/org/example/product/domain/SearchProduct.java`

```java
package org.example.product.domain;

import java.math.BigDecimal;

/**
 * Product representation in search results with additional search metadata.
 */
public record SearchProduct(
    long sku,
    String description,
    BigDecimal price,
    int availableQuantity,
    String category,
    double relevanceScore      // Search relevance score (0.0 - 1.0)
) {
    public boolean isInStock() {
        return availableQuantity > 0;
    }
}
```

---

## Phase 2: Search Validation

### 2.1 Search Request Validator

**New File:** `apps/product-service/src/main/java/org/example/product/validation/SearchRequestValidator.java`

```java
package org.example.product.validation;

import org.example.platform.error.ValidationException;
import org.example.product.domain.SearchCriteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
public class SearchRequestValidator {

    private static final int MIN_QUERY_LENGTH = 2;
    private static final int MAX_QUERY_LENGTH = 200;
    private static final BigDecimal MAX_PRICE = new BigDecimal("999999.99");

    public Mono<Void> validate(SearchCriteria criteria) {
        List<String> errors = new ArrayList<>();

        // Query validation
        if (criteria.query() == null || criteria.query().isBlank()) {
            errors.add("Search query is required");
        } else if (criteria.query().length() < MIN_QUERY_LENGTH) {
            errors.add("Search query must be at least " + MIN_QUERY_LENGTH + " characters");
        } else if (criteria.query().length() > MAX_QUERY_LENGTH) {
            errors.add("Search query must not exceed " + MAX_QUERY_LENGTH + " characters");
        }

        // Price range validation
        criteria.minPrice().ifPresent(min -> {
            if (min.compareTo(BigDecimal.ZERO) < 0) {
                errors.add("Minimum price cannot be negative");
            }
            if (min.compareTo(MAX_PRICE) > 0) {
                errors.add("Minimum price exceeds maximum allowed value");
            }
        });

        criteria.maxPrice().ifPresent(max -> {
            if (max.compareTo(BigDecimal.ZERO) < 0) {
                errors.add("Maximum price cannot be negative");
            }
            if (max.compareTo(MAX_PRICE) > 0) {
                errors.add("Maximum price exceeds maximum allowed value");
            }
        });

        // Min/max price consistency
        if (criteria.minPrice().isPresent() && criteria.maxPrice().isPresent()) {
            if (criteria.minPrice().get().compareTo(criteria.maxPrice().get()) > 0) {
                errors.add("Minimum price cannot be greater than maximum price");
            }
        }

        // Availability validation
        criteria.minAvailability().ifPresent(min -> {
            if (min < 0) {
                errors.add("Minimum availability cannot be negative");
            }
        });

        // Sort field validation
        if (!isValidSortField(criteria.sortBy())) {
            errors.add("Invalid sort field: " + criteria.sortBy() +
                       ". Valid values: relevance, price, availability, description");
        }

        if (!errors.isEmpty()) {
            return Mono.error(new ValidationException(errors));
        }

        return Mono.empty();
    }

    private boolean isValidSortField(String sortBy) {
        return sortBy != null && List.of("relevance", "price", "availability", "description")
            .contains(sortBy.toLowerCase());
    }
}
```

---

## Phase 3: Catalog Service Client

### 3.1 Catalog Service Client Interface

**New File:** `apps/product-service/src/main/java/org/example/product/client/CatalogServiceClient.java`

```java
package org.example.product.client;

import org.example.product.domain.SearchCriteria;
import org.example.product.domain.SearchProduct;
import org.example.product.domain.SearchResponse;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Client for external catalog/search service.
 */
public interface CatalogServiceClient {

    /**
     * Search products based on criteria.
     */
    Mono<SearchResponse<SearchProduct>> search(SearchCriteria criteria);

    /**
     * Get search suggestions for autocomplete.
     */
    Mono<List<String>> getSuggestions(String prefix, int limit);
}
```

### 3.2 Catalog Service Client Implementation

**New File:** `apps/product-service/src/main/java/org/example/product/client/CatalogServiceClientImpl.java`

```java
package org.example.product.client;

import org.example.platform.logging.StructuredLogger;
import org.example.platform.resilience.ReactiveResilience;
import org.example.product.domain.SearchCriteria;
import org.example.product.domain.SearchProduct;
import org.example.product.domain.SearchResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class CatalogServiceClientImpl implements CatalogServiceClient {

    private static final String LOGGER_NAME = "CatalogServiceClient";

    private final WebClient catalogWebClient;
    private final ReactiveResilience resilience;
    private final StructuredLogger structuredLogger;

    public CatalogServiceClientImpl(
            @Qualifier("catalogWebClient") WebClient catalogWebClient,
            ReactiveResilience resilience,
            StructuredLogger structuredLogger) {
        this.catalogWebClient = catalogWebClient;
        this.resilience = resilience;
        this.structuredLogger = structuredLogger;
    }

    @Override
    public Mono<SearchResponse<SearchProduct>> search(SearchCriteria criteria) {
        return Mono.deferContextual(ctx -> {
            structuredLogger.logOutboundRequest(
                LOGGER_NAME,
                "POST",
                "/catalog/search",
                criteria
            );

            return catalogWebClient
                .post()
                .uri("/catalog/search")
                .bodyValue(toCatalogSearchRequest(criteria))
                .retrieve()
                .bodyToMono(CatalogSearchResponse.class)
                .map(this::toSearchResponse)
                .transform(resilience.decorate("catalog"));
        });
    }

    @Override
    public Mono<List<String>> getSuggestions(String prefix, int limit) {
        return Mono.deferContextual(ctx -> {
            structuredLogger.logOutboundRequest(
                LOGGER_NAME,
                "GET",
                "/catalog/suggestions?prefix=" + prefix + "&limit=" + limit,
                null
            );

            return catalogWebClient
                .get()
                .uri(uriBuilder -> uriBuilder
                    .path("/catalog/suggestions")
                    .queryParam("prefix", prefix)
                    .queryParam("limit", limit)
                    .build())
                .retrieve()
                .bodyToMono(SuggestionsResponse.class)
                .map(SuggestionsResponse::suggestions)
                .transform(resilience.decorate("catalog"));
        });
    }

    private CatalogSearchRequest toCatalogSearchRequest(SearchCriteria criteria) {
        return new CatalogSearchRequest(
            criteria.query(),
            criteria.minPrice().orElse(null),
            criteria.maxPrice().orElse(null),
            criteria.minAvailability().orElse(null),
            criteria.inStockOnly().orElse(null),
            criteria.category().orElse(null),
            criteria.sortBy(),
            criteria.sortDirection().name(),
            criteria.page(),
            criteria.size()
        );
    }

    private SearchResponse<SearchProduct> toSearchResponse(CatalogSearchResponse response) {
        return new SearchResponse<>(
            response.products().stream()
                .map(this::toSearchProduct)
                .toList(),
            response.totalCount(),
            response.totalPages(),
            response.page(),
            response.size(),
            response.query(),
            response.searchTimeMs()
        );
    }

    private SearchProduct toSearchProduct(CatalogProduct product) {
        return new SearchProduct(
            product.sku(),
            product.description(),
            product.price(),
            product.availableQuantity(),
            product.category(),
            product.relevanceScore()
        );
    }

    // Internal DTOs for catalog service communication
    private record CatalogSearchRequest(
        String query,
        java.math.BigDecimal minPrice,
        java.math.BigDecimal maxPrice,
        Integer minAvailability,
        Boolean inStockOnly,
        String category,
        String sortBy,
        String sortDirection,
        int page,
        int size
    ) {}

    private record CatalogSearchResponse(
        List<CatalogProduct> products,
        long totalCount,
        int totalPages,
        int page,
        int size,
        String query,
        long searchTimeMs
    ) {}

    private record CatalogProduct(
        long sku,
        String description,
        java.math.BigDecimal price,
        int availableQuantity,
        String category,
        double relevanceScore
    ) {}

    private record SuggestionsResponse(List<String> suggestions) {}
}
```

---

## Phase 4: Search Service

### 4.1 Product Search Service

**New File:** `apps/product-service/src/main/java/org/example/product/service/ProductSearchService.java`

```java
package org.example.product.service;

import org.example.platform.cache.ReactiveCacheService;
import org.example.platform.logging.StructuredLogger;
import org.example.product.client.CatalogServiceClient;
import org.example.product.config.SearchCacheProperties;
import org.example.product.domain.SearchCriteria;
import org.example.product.domain.SearchProduct;
import org.example.product.domain.SearchResponse;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class ProductSearchService {

    private static final String LOGGER_NAME = "ProductSearchService";
    private static final int DEFAULT_SUGGESTION_LIMIT = 10;

    private final CatalogServiceClient catalogServiceClient;
    private final ReactiveCacheService cacheService;
    private final SearchCacheProperties cacheProperties;
    private final StructuredLogger structuredLogger;

    public ProductSearchService(
            CatalogServiceClient catalogServiceClient,
            ReactiveCacheService cacheService,
            SearchCacheProperties cacheProperties,
            StructuredLogger structuredLogger) {
        this.catalogServiceClient = catalogServiceClient;
        this.cacheService = cacheService;
        this.cacheProperties = cacheProperties;
        this.structuredLogger = structuredLogger;
    }

    public Mono<SearchResponse<SearchProduct>> search(SearchCriteria criteria) {
        return Mono.deferContextual(ctx -> {
            structuredLogger.logInfo(LOGGER_NAME, "Starting product search",
                "query", criteria.query(),
                "page", criteria.page(),
                "size", criteria.size());

            String cacheKey = buildSearchCacheKey(criteria);

            return cacheService
                .get(cacheKey, SearchResponse.class)
                .switchIfEmpty(Mono.defer(() ->
                    catalogServiceClient.search(criteria)
                        .flatMap(response ->
                            cacheService.put(cacheKey, response, cacheProperties.getSearchTtl())
                                .thenReturn(response)
                        )
                ))
                .doOnSuccess(response ->
                    structuredLogger.logInfo(LOGGER_NAME, "Product search completed",
                        "query", criteria.query(),
                        "totalItems", response.totalItems(),
                        "searchTimeMs", response.searchTimeMs())
                );
        });
    }

    public Mono<List<String>> getSuggestions(String prefix) {
        return getSuggestions(prefix, DEFAULT_SUGGESTION_LIMIT);
    }

    public Mono<List<String>> getSuggestions(String prefix, int limit) {
        return Mono.deferContextual(ctx -> {
            structuredLogger.logInfo(LOGGER_NAME, "Getting search suggestions",
                "prefix", prefix,
                "limit", limit);

            String cacheKey = buildSuggestionCacheKey(prefix, limit);

            return cacheService
                .get(cacheKey, List.class)
                .switchIfEmpty(Mono.defer(() ->
                    catalogServiceClient.getSuggestions(prefix, limit)
                        .flatMap(suggestions ->
                            cacheService.put(cacheKey, suggestions, cacheProperties.getSuggestionsTtl())
                                .thenReturn(suggestions)
                        )
                ))
                .doOnSuccess(suggestions ->
                    structuredLogger.logInfo(LOGGER_NAME, "Suggestions retrieved",
                        "prefix", prefix,
                        "count", suggestions.size())
                );
        });
    }

    private String buildSearchCacheKey(SearchCriteria criteria) {
        StringBuilder key = new StringBuilder("search:");
        key.append(criteria.query().toLowerCase().trim());
        criteria.minPrice().ifPresent(p -> key.append(":minP:").append(p));
        criteria.maxPrice().ifPresent(p -> key.append(":maxP:").append(p));
        criteria.minAvailability().ifPresent(a -> key.append(":minA:").append(a));
        criteria.inStockOnly().ifPresent(s -> key.append(":stock:").append(s));
        criteria.category().ifPresent(c -> key.append(":cat:").append(c.toLowerCase()));
        key.append(":sort:").append(criteria.sortBy()).append(":").append(criteria.sortDirection());
        key.append(":page:").append(criteria.page());
        key.append(":size:").append(criteria.size());
        return key.toString();
    }

    private String buildSuggestionCacheKey(String prefix, int limit) {
        return "suggestions:" + prefix.toLowerCase().trim() + ":limit:" + limit;
    }
}
```

---

## Phase 5: Search Controller

### 5.1 Product Search Controller

**New File:** `apps/product-service/src/main/java/org/example/product/controller/ProductSearchController.java`

```java
package org.example.product.controller;

import org.example.platform.logging.StructuredLogger;
import org.example.platform.logging.data.RequestLogData;
import org.example.platform.logging.data.ResponseLogData;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.example.product.domain.SearchCriteria;
import org.example.product.domain.SearchProduct;
import org.example.product.domain.SearchResponse;
import org.example.product.domain.SortDirection;
import org.example.product.service.ProductSearchService;
import org.example.product.validation.SearchRequestValidator;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/products/search")
public class ProductSearchController {

    private static final String LOGGER_NAME = "ProductSearchController";

    private final ProductSearchService searchService;
    private final SearchRequestValidator validator;
    private final StructuredLogger structuredLogger;

    public ProductSearchController(
            ProductSearchService searchService,
            SearchRequestValidator validator,
            StructuredLogger structuredLogger) {
        this.searchService = searchService;
        this.validator = validator;
        this.structuredLogger = structuredLogger;
    }

    @GetMapping
    public Mono<SearchResponse<SearchProduct>> search(
            @RequestParam String q,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minAvailability,
            @RequestParam(required = false) Boolean inStockOnly,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "relevance") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId
    ) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        SearchCriteria criteria = new SearchCriteria(
            q,
            Optional.ofNullable(minPrice),
            Optional.ofNullable(maxPrice),
            Optional.ofNullable(minAvailability),
            Optional.ofNullable(inStockOnly),
            Optional.ofNullable(category),
            sortBy,
            parseSortDirection(sortDirection),
            page,
            size
        );

        return Mono.deferContextual(ctx -> {
            structuredLogger.logInboundRequest(
                LOGGER_NAME,
                new RequestLogData("GET", "/products/search", q)
            );

            return validator.validate(criteria)
                .then(searchService.search(criteria))
                .doOnSuccess(response ->
                    structuredLogger.logOutboundResponse(
                        LOGGER_NAME,
                        new ResponseLogData(HttpStatus.OK.value(), response)
                    )
                );
        }).contextWrite(ctx -> ctx.put(ContextKeys.REQUEST_METADATA, metadata));
    }

    @GetMapping("/suggestions")
    public Mono<List<String>> getSuggestions(
            @RequestParam String prefix,
            @RequestParam(defaultValue = "10") int limit,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId
    ) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(ctx -> {
            structuredLogger.logInboundRequest(
                LOGGER_NAME,
                new RequestLogData("GET", "/products/search/suggestions", prefix)
            );

            return searchService.getSuggestions(prefix, Math.min(limit, 20))
                .doOnSuccess(suggestions ->
                    structuredLogger.logOutboundResponse(
                        LOGGER_NAME,
                        new ResponseLogData(HttpStatus.OK.value(), suggestions)
                    )
                );
        }).contextWrite(ctx -> ctx.put(ContextKeys.REQUEST_METADATA, metadata));
    }

    private SortDirection parseSortDirection(String direction) {
        try {
            return SortDirection.valueOf(direction.toUpperCase());
        } catch (IllegalArgumentException e) {
            return SortDirection.DESC;
        }
    }
}
```

---

## Phase 6: Configuration

### 6.1 Search Cache Properties

**New File:** `apps/product-service/src/main/java/org/example/product/config/SearchCacheProperties.java`

```java
package org.example.product.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@ConfigurationProperties(prefix = "cache.search")
public class SearchCacheProperties {

    private Duration searchTtl = Duration.ofMinutes(5);
    private Duration suggestionsTtl = Duration.ofHours(1);

    public Duration getSearchTtl() {
        return searchTtl;
    }

    public void setSearchTtl(Duration searchTtl) {
        this.searchTtl = searchTtl;
    }

    public Duration getSuggestionsTtl() {
        return suggestionsTtl;
    }

    public void setSuggestionsTtl(Duration suggestionsTtl) {
        this.suggestionsTtl = suggestionsTtl;
    }
}
```

### 6.2 WebClient Configuration Update

**Update:** `apps/product-service/src/main/java/org/example/product/config/ProductServiceConfig.java`

Add catalog WebClient bean:

```java
@Bean
public WebClient catalogWebClient(
        @Value("${app.services.catalog.base-url}") String catalogBaseUrl,
        WebClientLoggingFilter loggingFilter) {
    return WebClient.builder()
        .baseUrl(catalogBaseUrl)
        .filter(loggingFilter.create("CatalogServiceClient"))
        .build();
}
```

### 6.3 Application Configuration Update

**Update:** `apps/product-service/src/main/resources/application.yml`

```yaml
app:
  services:
    # Existing services...
    merchandise:
      base-url: ${MERCHANDISE_BASE_URL:http://localhost:8081}
    price:
      base-url: ${PRICE_BASE_URL:http://localhost:8081}
    inventory:
      base-url: ${INVENTORY_BASE_URL:http://localhost:8081}
    # New catalog service
    catalog:
      base-url: ${CATALOG_BASE_URL:http://localhost:8081}

cache:
  merchandise:
    ttl: 15m
  price:
    ttl: 2m
  inventory:
    ttl: 30s
  # New search cache settings
  search:
    search-ttl: 5m
    suggestions-ttl: 1h

resilience4j:
  circuitbreaker:
    instances:
      # Existing instances...
      catalog:
        registerHealthIndicator: true
        slidingWindowSize: 10
        permittedNumberOfCallsInHalfOpenState: 3
        waitDurationInOpenState: 10s
        failureRateThreshold: 50

  retry:
    instances:
      # Existing instances...
      catalog:
        maxAttempts: 3
        waitDuration: 100ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
        retryExceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException

  timelimiter:
    instances:
      # Existing instances...
      catalog:
        timeoutDuration: 3s

  bulkhead:
    instances:
      # Existing instances...
      catalog:
        maxConcurrentCalls: 25
        maxWaitDuration: 0
```

---

## Phase 7: WireMock Stubs

### 7.1 Catalog Search Stub

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
        "headers": {
          "Content-Type": "application/json"
        },
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
        "bodyPatterns": [
          {
            "matchesJsonPath": {
              "expression": "$.query",
              "contains": "nonexistent"
            }
          }
        ]
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
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

### 7.2 Catalog Suggestions Stub

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
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "suggestions": [
            "laptop",
            "laptop bag",
            "laptop stand",
            "laptop charger",
            "laptop sleeve"
          ]
        }
      }
    }
  ]
}
```

### 7.3 Catalog Chaos Stubs

**New File:** `docker/wiremock/mappings/catalog-chaos.json`

```json
{
  "mappings": [
    {
      "name": "Catalog Search - Timeout",
      "scenarioName": "catalog-chaos",
      "requiredScenarioState": "timeout",
      "request": {
        "method": "POST",
        "urlPath": "/catalog/search"
      },
      "response": {
        "status": 200,
        "fixedDelayMilliseconds": 5000,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "products": [],
          "totalCount": 0,
          "totalPages": 0,
          "page": 0,
          "size": 20,
          "query": "",
          "searchTimeMs": 5000
        }
      }
    },
    {
      "name": "Catalog Search - 500 Error",
      "scenarioName": "catalog-chaos",
      "requiredScenarioState": "error-500",
      "request": {
        "method": "POST",
        "urlPath": "/catalog/search"
      },
      "response": {
        "status": 500,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "error": "Internal Server Error",
          "message": "Catalog service unavailable"
        }
      }
    },
    {
      "name": "Catalog Search - 503 Service Unavailable",
      "scenarioName": "catalog-chaos",
      "requiredScenarioState": "error-503",
      "request": {
        "method": "POST",
        "urlPath": "/catalog/search"
      },
      "response": {
        "status": 503,
        "headers": {
          "Content-Type": "application/json",
          "Retry-After": "5"
        },
        "jsonBody": {
          "error": "Service Unavailable",
          "message": "Catalog service is temporarily unavailable"
        }
      }
    }
  ]
}
```

---

## Phase 8: Testing

### 8.1 Unit Tests

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

import static org.assertj.core.api.Assertions.assertThat;

class SearchRequestValidatorTest {

    private SearchRequestValidator validator;

    @BeforeEach
    void setUp() {
        validator = new SearchRequestValidator();
    }

    @Test
    void shouldAcceptValidSearchCriteria() {
        SearchCriteria criteria = new SearchCriteria(
            "laptop",
            Optional.of(new BigDecimal("100")),
            Optional.of(new BigDecimal("500")),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "price",
            SortDirection.ASC,
            0,
            20
        );

        StepVerifier.create(validator.validate(criteria))
            .verifyComplete();
    }

    @Test
    void shouldRejectEmptyQuery() {
        SearchCriteria criteria = new SearchCriteria(
            "",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "relevance",
            SortDirection.DESC,
            0,
            20
        );

        StepVerifier.create(validator.validate(criteria))
            .expectError(ValidationException.class)
            .verify();
    }

    @Test
    void shouldRejectQueryTooShort() {
        SearchCriteria criteria = new SearchCriteria(
            "a",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "relevance",
            SortDirection.DESC,
            0,
            20
        );

        StepVerifier.create(validator.validate(criteria))
            .expectError(ValidationException.class)
            .verify();
    }

    @Test
    void shouldRejectMinPriceGreaterThanMaxPrice() {
        SearchCriteria criteria = new SearchCriteria(
            "laptop",
            Optional.of(new BigDecimal("500")),
            Optional.of(new BigDecimal("100")),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "price",
            SortDirection.ASC,
            0,
            20
        );

        StepVerifier.create(validator.validate(criteria))
            .expectError(ValidationException.class)
            .verify();
    }

    @Test
    void shouldRejectNegativePrice() {
        SearchCriteria criteria = new SearchCriteria(
            "laptop",
            Optional.of(new BigDecimal("-10")),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "price",
            SortDirection.ASC,
            0,
            20
        );

        StepVerifier.create(validator.validate(criteria))
            .expectError(ValidationException.class)
            .verify();
    }

    @Test
    void shouldRejectInvalidSortField() {
        SearchCriteria criteria = new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "invalid_field",
            SortDirection.DESC,
            0,
            20
        );

        StepVerifier.create(validator.validate(criteria))
            .expectError(ValidationException.class)
            .verify();
    }
}
```

### 8.2 Controller Tests

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

    @Test
    void shouldReturnSearchResults() {
        SearchProduct product = new SearchProduct(
            123456L,
            "Laptop Computer",
            new BigDecimal("999.99"),
            50,
            "Electronics",
            0.95
        );

        SearchResponse<SearchProduct> response = new SearchResponse<>(
            List.of(product),
            1L,
            1,
            0,
            20,
            "laptop",
            45L
        );

        when(validator.validate(any())).thenReturn(Mono.empty());
        when(searchService.search(any())).thenReturn(Mono.just(response));

        webTestClient.get()
            .uri("/products/search?q=laptop")
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
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
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
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
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isBadRequest();
    }
}
```

### 8.3 Integration Tests

**New File:** `apps/product-service/src/test/java/org/example/product/integration/ProductSearchIntegrationTest.java`

```java
package org.example.product.integration;

import com.github.tomakehurst.wiremock.WireMockServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
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

    @LocalServerPort
    private int port;

    @Autowired
    private WebTestClient webTestClient;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        wireMockServer = new WireMockServer(0);
        wireMockServer.start();

        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
        registry.add("app.services.catalog.base-url", () -> wireMockServer.baseUrl());
        registry.add("app.services.merchandise.base-url", () -> wireMockServer.baseUrl());
        registry.add("app.services.price.base-url", () -> wireMockServer.baseUrl());
        registry.add("app.services.inventory.base-url", () -> wireMockServer.baseUrl());
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

        // Verify catalog service was called with price filters
        wireMockServer.verify(postRequestedFor(urlPathEqualTo("/catalog/search"))
            .withRequestBody(matchingJsonPath("$.minPrice", equalTo("50")))
            .withRequestBody(matchingJsonPath("$.maxPrice", equalTo("100"))));
    }

    private void setupCatalogMocks() {
        // Default search response
        wireMockServer.stubFor(post(urlPathEqualTo("/catalog/search"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {
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
                    """)));

        // No results search
        wireMockServer.stubFor(post(urlPathEqualTo("/catalog/search"))
            .withRequestBody(matchingJsonPath("$.query", containing("nonexistent")))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {
                        "products": [],
                        "totalCount": 0,
                        "totalPages": 0,
                        "page": 0,
                        "size": 20,
                        "query": "nonexistent",
                        "searchTimeMs": 12
                    }
                    """)));

        // Suggestions endpoint
        wireMockServer.stubFor(get(urlPathMatching("/catalog/suggestions.*"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {
                        "suggestions": ["laptop", "laptop bag", "laptop stand", "laptop charger"]
                    }
                    """)));
    }
}
```

---

## Phase 9: E2E Tests (k6)

### 9.1 Product Search Load Test

**New File:** `e2e-test/k6/product-search-test.js`

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const searchLatency = new Trend('search_latency');
const suggestionLatency = new Trend('suggestion_latency');
const searchErrors = new Rate('search_errors');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Test data
const SEARCH_QUERIES = [
    'laptop',
    'phone',
    'tablet',
    'keyboard',
    'monitor',
    'mouse',
    'headphones',
    'camera'
];

const HEADERS = {
    'x-store-number': '100',
    'x-order-number': '550e8400-e29b-41d4-a716-446655440000',
    'x-userid': 'user01',
    'x-sessionid': '550e8400-e29b-41d4-a716-446655440000'
};

export const options = {
    scenarios: {
        // Steady load for search
        search_steady: {
            executor: 'constant-vus',
            vus: 10,
            duration: '2m',
            tags: { scenario: 'search_steady' }
        },
        // Ramp up for search
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
        // Suggestion requests (higher frequency, lower load)
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

        const url = `${BASE_URL}/products/search?q=${query}&page=${page}&size=${size}`;
        const startTime = Date.now();

        const response = http.get(url, { headers: HEADERS });

        const latency = Date.now() - startTime;
        searchLatency.add(latency);

        const success = check(response, {
            'search status is 200': (r) => r.status === 200,
            'search has items': (r) => {
                const body = JSON.parse(r.body);
                return body.items !== undefined;
            },
            'search has pagination': (r) => {
                const body = JSON.parse(r.body);
                return body.totalItems !== undefined && body.totalPages !== undefined;
            }
        });

        if (!success) {
            searchErrors.add(1);
        } else {
            searchErrors.add(0);
        }
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

        const latency = Date.now() - startTime;
        suggestionLatency.add(latency);

        check(response, {
            'suggestions status is 200': (r) => r.status === 200,
            'suggestions is array': (r) => {
                const body = JSON.parse(r.body);
                return Array.isArray(body);
            }
        });
    });

    sleep(0.2);
}
```

---

## Phase 10: Security (if OAuth2 is enabled)

If OAuth2 security is enabled (per 006_AUTHN_AUTHZ.md), the search endpoints require authorization:

| Endpoint | Required Scope |
|----------|----------------|
| GET /products/search | `product:read` |
| GET /products/search/suggestions | `product:read` |

The existing `@PreAuthorize("hasAuthority('SCOPE_product:read')")` pattern from the ProductController can be applied.

---

## Implementation Order

### Step 1: Domain Models
1. [ ] Create `SearchCriteria.java`
2. [ ] Create `SortDirection.java`
3. [ ] Create `SearchResponse.java`
4. [ ] Create `SearchProduct.java`

### Step 2: Validation
1. [ ] Create `SearchRequestValidator.java`
2. [ ] Add unit tests for validator

### Step 3: Configuration
1. [ ] Create `SearchCacheProperties.java`
2. [ ] Update `application.yml` with catalog service config
3. [ ] Update `ProductServiceConfig.java` with catalog WebClient bean
4. [ ] Add resilience4j configuration for catalog

### Step 4: Catalog Service Client
1. [ ] Create `CatalogServiceClient.java` interface
2. [ ] Create `CatalogServiceClientImpl.java` implementation

### Step 5: Search Service
1. [ ] Create `ProductSearchService.java`
2. [ ] Implement cache-aside pattern for search results

### Step 6: Controller
1. [ ] Create `ProductSearchController.java`
2. [ ] Add controller tests

### Step 7: WireMock Stubs
1. [ ] Create `catalog-search.json`
2. [ ] Create `catalog-suggestions.json`
3. [ ] Create `catalog-chaos.json`

### Step 8: Integration Tests
1. [ ] Create `ProductSearchIntegrationTest.java`
2. [ ] Verify caching behavior
3. [ ] Verify resilience patterns

### Step 9: E2E Tests
1. [ ] Create `product-search-test.js`
2. [ ] Add to Docker Compose profiles

### Step 10: Documentation
1. [ ] Update CLAUDE.md with new endpoints
2. [ ] Update API documentation

---

## Files Summary

### New Files

| File | Purpose |
|------|---------|
| `domain/SearchCriteria.java` | Search criteria record |
| `domain/SortDirection.java` | Sort direction enum |
| `domain/SearchResponse.java` | Paginated search response |
| `domain/SearchProduct.java` | Product in search results |
| `validation/SearchRequestValidator.java` | Search request validation |
| `config/SearchCacheProperties.java` | Search cache configuration |
| `client/CatalogServiceClient.java` | Catalog client interface |
| `client/CatalogServiceClientImpl.java` | Catalog client implementation |
| `service/ProductSearchService.java` | Search service |
| `controller/ProductSearchController.java` | Search controller |
| `docker/wiremock/mappings/catalog-search.json` | WireMock search stub |
| `docker/wiremock/mappings/catalog-suggestions.json` | WireMock suggestions stub |
| `docker/wiremock/mappings/catalog-chaos.json` | WireMock chaos stubs |
| `test/.../SearchRequestValidatorTest.java` | Validator unit tests |
| `test/.../ProductSearchControllerTest.java` | Controller tests |
| `test/.../ProductSearchIntegrationTest.java` | Integration tests |
| `e2e-test/k6/product-search-test.js` | k6 load tests |

### Modified Files

| File | Changes |
|------|---------|
| `ProductServiceConfig.java` | Add catalog WebClient bean |
| `application.yml` | Add catalog service and cache config |
| `application-docker.yml` | Add Docker-specific catalog config |

---

## Open Questions

1. **Search Backend**: Should the catalog service be implemented as:
   - A stub service with in-memory data?
   - An Elasticsearch-backed service?
   - A database-backed service with full-text search?
   - **Proposed:** Start with WireMock stub, design for future Elasticsearch integration

2. **Search Scope**: Should search include:
   - Only product descriptions?
   - Product categories and tags?
   - SKU numbers?
   - **Proposed:** Description and category for initial implementation

3. **Faceted Search**: Should we support faceted search (filters with counts)?
   - **Proposed:** Defer to future enhancement, start with basic filtering

4. **Search Analytics**: Should we track search queries for analytics?
   - **Proposed:** Yes, integrate with audit system (009_AUDIT_DATA)

5. **Rate Limiting**: Should search endpoints have stricter rate limits?
   - **Proposed:** Yes, consider lower limits for suggestions (high frequency)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Catalog service latency impacts user experience | Aggressive caching (5 min TTL), circuit breaker |
| Search cache grows too large | Use cache key hashing, set max cache size, shorter TTL |
| Query injection attacks | Sanitize search input, use parameterized queries |
| Expensive queries slow system | Implement query complexity limits, pagination limits |
| High suggestion request volume | Longer TTL for suggestions (1 hour), rate limiting |

---

## References

- [Spring WebFlux Documentation](https://docs.spring.io/spring-framework/reference/web/webflux.html)
- [Resilience4j Documentation](https://resilience4j.readme.io/docs)
- [Redis Caching Best Practices](https://redis.io/docs/manual/patterns/)
- [k6 Load Testing](https://k6.io/docs/)
