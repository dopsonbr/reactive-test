# 011: Product Search API Implementation

**Status: DRAFT**

**Related Plans:**
- **012_PRODUCT_SEARCH_TESTING** - Testing infrastructure, WireMock stubs, and e2e tests

---

## Overview

This plan adds search endpoints to the product-service, enabling clients to search for products by various criteria. The implementation includes full-text search, filtering, pagination, and sorting capabilities using reactive patterns.

## Goals

1. Add search endpoints to product-service for finding products by description, price range, and availability
2. Implement pagination and sorting for search results
3. Add caching for search results with appropriate TTL
4. Apply resilience patterns for search operations
5. Maintain consistency with existing platform patterns (logging, error handling, validation)

## References

**Standards:**
- `docs/standards/validation.md` - Request validation patterns
- `docs/standards/caching.md` - Cache-aside pattern
- `docs/standards/resiliency-circuit-breakers.md` - Circuit breaker configuration
- `docs/standards/error-handling.md` - Error response format

**Templates:**
- `docs/templates/_template_controller.md` - Controller pattern

---

## Current State

### Existing Product Service

| Method | Path | Description |
|--------|------|-------------|
| GET | `/products/{sku}` | Get product by SKU |

**Key Files:**
- `ProductController.java:40-66` - Single GET endpoint
- `ProductService.java` - Aggregates merchandise, price, and inventory
- `Product.java` - Domain record

### External Services

Product-service aggregates from three external services (merchandise, price, inventory). Search requires a new **Catalog Service** for bulk search operations.

---

## Target State

### New Search Endpoints

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/products/search` | Search products | `SearchResponse<Product>` |
| GET | `/products/search/suggestions` | Autocomplete | `List<String>` |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | String | Yes | Search query (2-200 chars) |
| `minPrice` | BigDecimal | No | Minimum price filter |
| `maxPrice` | BigDecimal | No | Maximum price filter |
| `minAvailability` | Integer | No | Minimum stock |
| `inStockOnly` | Boolean | No | Only in-stock items |
| `category` | String | No | Category filter |
| `customerZipCode` | String | No | 5-digit or 5+4 zip code |
| `sellingLocation` | String | No | Store ID (1-9999) or virtual: ONLINE, MOBILE_APP, KIOSK, CALL_CENTER |
| `sortBy` | String | No | relevance, price, availability, description (default: relevance) |
| `sortDirection` | String | No | ASC, DESC (default: DESC) |
| `page` | int | No | Page number, 0-based (default: 0) |
| `size` | int | No | Page size, 1-100 (default: 20) |

### Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  GET /products/search?q=laptop&customerZipCode=12345&sellingLocation=ONLINE   │
└─────────────────────────────────────┬─────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ProductSearchController                              │
│  1. Extract and validate search parameters                                   │
│  2. Build SearchCriteria object                                              │
│  3. Call ProductSearchService                                                │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ProductSearchService                                 │
│  1. Check Redis cache for search results                                     │
│  2. If cache miss, call Catalog Service                                      │
│  3. Apply resilience patterns (circuit breaker, retry, timeout)              │
│  4. Cache results with TTL                                                   │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         External Catalog Service                             │
│  POST /catalog/search | GET /catalog/suggestions                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Domain Models

### 1.1 SearchCriteria

**New File:** `apps/product-service/src/main/java/org/example/product/domain/SearchCriteria.java`

```java
package org.example.product.domain;

import java.math.BigDecimal;
import java.util.Optional;

public record SearchCriteria(
    String query,
    Optional<BigDecimal> minPrice,
    Optional<BigDecimal> maxPrice,
    Optional<Integer> minAvailability,
    Optional<Boolean> inStockOnly,
    Optional<String> category,
    Optional<String> customerZipCode,
    Optional<String> sellingLocation,
    String sortBy,
    SortDirection sortDirection,
    int page,
    int size
) {
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
    public static final String DEFAULT_SORT = "relevance";

    public SearchCriteria {
        if (size <= 0) size = DEFAULT_PAGE_SIZE;
        if (size > MAX_PAGE_SIZE) size = MAX_PAGE_SIZE;
        if (page < 0) page = 0;
        if (sortBy == null || sortBy.isBlank()) sortBy = DEFAULT_SORT;
        if (sortDirection == null) sortDirection = SortDirection.DESC;
    }
}
```

### 1.2 SortDirection

**New File:** `apps/product-service/src/main/java/org/example/product/domain/SortDirection.java`

```java
package org.example.product.domain;

public enum SortDirection {
    ASC, DESC
}
```

### 1.3 SearchResponse

**New File:** `apps/product-service/src/main/java/org/example/product/domain/SearchResponse.java`

```java
package org.example.product.domain;

import java.util.List;

public record SearchResponse<T>(
    List<T> items,
    long totalItems,
    int totalPages,
    int currentPage,
    int pageSize,
    String query,
    long searchTimeMs
) {
    public boolean hasNext() { return currentPage < totalPages - 1; }
    public boolean hasPrevious() { return currentPage > 0; }
}
```

### 1.4 SearchProduct

**New File:** `apps/product-service/src/main/java/org/example/product/domain/SearchProduct.java`

```java
package org.example.product.domain;

import java.math.BigDecimal;

public record SearchProduct(
    long sku,
    String description,
    BigDecimal price,
    int availableQuantity,
    String category,
    double relevanceScore
) {
    public boolean isInStock() { return availableQuantity > 0; }
}
```

---

## Phase 2: Search Validation

### 2.1 SearchRequestValidator

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
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class SearchRequestValidator {

    private static final int MIN_QUERY_LENGTH = 2;
    private static final int MAX_QUERY_LENGTH = 200;
    private static final BigDecimal MAX_PRICE = new BigDecimal("999999.99");
    private static final Pattern ZIP_CODE_PATTERN = Pattern.compile("^\\d{5}(-\\d{4})?$");
    private static final Set<String> VIRTUAL_STORE_TYPES = Set.of("ONLINE", "MOBILE_APP", "KIOSK", "CALL_CENTER");

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

        // Price validation
        criteria.minPrice().ifPresent(min -> {
            if (min.compareTo(BigDecimal.ZERO) < 0) errors.add("Minimum price cannot be negative");
            if (min.compareTo(MAX_PRICE) > 0) errors.add("Minimum price exceeds maximum allowed value");
        });
        criteria.maxPrice().ifPresent(max -> {
            if (max.compareTo(BigDecimal.ZERO) < 0) errors.add("Maximum price cannot be negative");
            if (max.compareTo(MAX_PRICE) > 0) errors.add("Maximum price exceeds maximum allowed value");
        });
        if (criteria.minPrice().isPresent() && criteria.maxPrice().isPresent()) {
            if (criteria.minPrice().get().compareTo(criteria.maxPrice().get()) > 0) {
                errors.add("Minimum price cannot be greater than maximum price");
            }
        }

        // Availability validation
        criteria.minAvailability().ifPresent(min -> {
            if (min < 0) errors.add("Minimum availability cannot be negative");
        });

        // Zip code validation
        criteria.customerZipCode().ifPresent(zip -> {
            if (!ZIP_CODE_PATTERN.matcher(zip).matches()) {
                errors.add("Invalid zip code format. Expected 5 digits or 5+4 format");
            }
        });

        // Selling location validation
        criteria.sellingLocation().ifPresent(location -> {
            if (!isValidSellingLocation(location)) {
                errors.add("Invalid selling location: " + location +
                           ". Must be numeric store ID (1-9999) or: " + VIRTUAL_STORE_TYPES);
            }
        });

        // Sort field validation
        if (!isValidSortField(criteria.sortBy())) {
            errors.add("Invalid sort field. Valid values: relevance, price, availability, description");
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

    private boolean isValidSellingLocation(String location) {
        if (location == null || location.isBlank()) return false;
        if (VIRTUAL_STORE_TYPES.contains(location.toUpperCase())) return true;
        try {
            int storeId = Integer.parseInt(location);
            return storeId >= 1 && storeId <= 9999;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
```

---

## Phase 3: Catalog Search Repository

**New File:** `apps/product-service/src/main/java/org/example/product/repository/catalog/CatalogSearchRepository.java`

```java
package org.example.product.repository.catalog;

import java.math.BigDecimal;
import java.util.List;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.resilience.ReactiveResilience;
import org.example.product.domain.SearchCriteria;
import org.example.product.domain.SearchProduct;
import org.example.product.domain.SearchResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Repository
public class CatalogSearchRepository {

    private static final String RESILIENCE_NAME = "catalog";
    private static final String LOGGER_NAME = "catalogsearchrepository";

    private final WebClient catalogWebClient;
    private final ReactiveResilience resilience;
    private final StructuredLogger structuredLogger;

    public CatalogSearchRepository(
            @Qualifier("catalogWebClient") WebClient catalogWebClient,
            ReactiveResilience resilience,
            StructuredLogger structuredLogger) {
        this.catalogWebClient = catalogWebClient;
        this.resilience = resilience;
        this.structuredLogger = structuredLogger;
    }

    public Mono<SearchResponse<SearchProduct>> search(SearchCriteria criteria) {
        Mono<CatalogSearchResponse> call =
                catalogWebClient
                        .post()
                        .uri("/catalog/search")
                        .bodyValue(toCatalogSearchRequest(criteria))
                        .retrieve()
                        .bodyToMono(CatalogSearchResponse.class);

        return resilience
                .decorate(RESILIENCE_NAME, call)
                .map(this::toSearchResponse)
                .onErrorResume(this::handleSearchError);
    }

    public Mono<List<String>> getSuggestions(String prefix, int limit) {
        Mono<SuggestionsResponse> call =
                catalogWebClient
                        .get()
                        .uri(b -> b.path("/catalog/suggestions")
                                .queryParam("prefix", prefix)
                                .queryParam("limit", limit)
                                .build())
                        .retrieve()
                        .bodyToMono(SuggestionsResponse.class);

        return resilience
                .decorate(RESILIENCE_NAME, call)
                .map(SuggestionsResponse::suggestions)
                .onErrorResume(this::handleSuggestionsError);
    }

    private CatalogSearchRequest toCatalogSearchRequest(SearchCriteria c) {
        return new CatalogSearchRequest(c.query(), c.minPrice().orElse(null),
            c.maxPrice().orElse(null), c.minAvailability().orElse(null),
            c.inStockOnly().orElse(null), c.category().orElse(null),
            c.customerZipCode().orElse(null), c.sellingLocation().orElse(null),
            c.sortBy(), c.sortDirection().name(), c.page(), c.size());
    }

    private SearchResponse<SearchProduct> toSearchResponse(CatalogSearchResponse r) {
        return new SearchResponse<>(
            r.products().stream().map(p -> new SearchProduct(p.sku(), p.description(),
                p.price(), p.availableQuantity(), p.category(), p.relevanceScore())).toList(),
            r.totalCount(), r.totalPages(), r.page(), r.size(), r.query(), r.searchTimeMs());
    }

    private Mono<SearchResponse<SearchProduct>> handleSearchError(Throwable t) {
        return Mono.deferContextual(ctx -> {
            String cbState = resilience.getCircuitBreakerState(RESILIENCE_NAME).name();
            structuredLogger.logError(ctx, LOGGER_NAME, RESILIENCE_NAME, t, cbState);
            return Mono.error(t);
        });
    }

    private Mono<List<String>> handleSuggestionsError(Throwable t) {
        return Mono.deferContextual(ctx -> {
            String cbState = resilience.getCircuitBreakerState(RESILIENCE_NAME).name();
            structuredLogger.logError(ctx, LOGGER_NAME, RESILIENCE_NAME, t, cbState);
            return Mono.just(List.of());
        });
    }

    // Internal DTOs
    private record CatalogSearchRequest(String query, BigDecimal minPrice,
        BigDecimal maxPrice, Integer minAvailability, Boolean inStockOnly,
        String category, String customerZipCode, String sellingLocation,
        String sortBy, String sortDirection, int page, int size) {}
    private record CatalogSearchResponse(List<CatalogProduct> products, long totalCount,
        int totalPages, int page, int size, String query, long searchTimeMs) {}
    private record CatalogProduct(long sku, String description, BigDecimal price,
        int availableQuantity, String category, double relevanceScore) {}
    private record SuggestionsResponse(List<String> suggestions) {}
}
```

---

## Phase 4: Search Service

**New File:** `apps/product-service/src/main/java/org/example/product/service/ProductSearchService.java`

```java
package org.example.product.service;

import org.example.platform.cache.ReactiveCacheService;
import org.example.platform.logging.StructuredLogger;
import org.example.product.repository.catalog.CatalogSearchRepository;
import org.example.product.config.SearchCacheProperties;
import org.example.product.domain.*;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import java.util.List;

@Service
public class ProductSearchService {

    private static final String LOGGER_NAME = "ProductSearchService";
    private final CatalogSearchRepository catalogSearchRepository;
    private final ReactiveCacheService cacheService;
    private final SearchCacheProperties cacheProperties;
    private final StructuredLogger structuredLogger;

    public ProductSearchService(CatalogSearchRepository catalogSearchRepository,
            ReactiveCacheService cacheService, SearchCacheProperties cacheProperties,
            StructuredLogger structuredLogger) {
        this.catalogSearchRepository = catalogSearchRepository;
        this.cacheService = cacheService;
        this.cacheProperties = cacheProperties;
        this.structuredLogger = structuredLogger;
    }

    public Mono<SearchResponse<SearchProduct>> search(SearchCriteria criteria) {
        return Mono.deferContextual(ctx -> {
            structuredLogger.logInfo(LOGGER_NAME, "Starting product search",
                "query", criteria.query(), "page", criteria.page());
            String cacheKey = buildSearchCacheKey(criteria);
            return cacheService.get(cacheKey, SearchResponse.class)
                .switchIfEmpty(Mono.defer(() ->
                    catalogSearchRepository.search(criteria)
                        .flatMap(r -> cacheService.put(cacheKey, r, cacheProperties.getSearchTtl())
                            .thenReturn(r))))
                .doOnSuccess(r -> structuredLogger.logInfo(LOGGER_NAME, "Search completed",
                    "totalItems", r.totalItems()));
        });
    }

    public Mono<List<String>> getSuggestions(String prefix, int limit) {
        return Mono.deferContextual(ctx -> {
            String cacheKey = "suggestions:" + prefix.toLowerCase().trim() + ":limit:" + limit;
            return cacheService.get(cacheKey, List.class)
                .switchIfEmpty(Mono.defer(() ->
                    catalogSearchRepository.getSuggestions(prefix, limit)
                        .flatMap(s -> cacheService.put(cacheKey, s, cacheProperties.getSuggestionsTtl())
                            .thenReturn(s))));
        });
    }

    private String buildSearchCacheKey(SearchCriteria c) {
        StringBuilder key = new StringBuilder("search:").append(c.query().toLowerCase().trim());
        c.minPrice().ifPresent(p -> key.append(":minP:").append(p));
        c.maxPrice().ifPresent(p -> key.append(":maxP:").append(p));
        c.minAvailability().ifPresent(a -> key.append(":minA:").append(a));
        c.inStockOnly().ifPresent(s -> key.append(":stock:").append(s));
        c.category().ifPresent(cat -> key.append(":cat:").append(cat.toLowerCase()));
        c.customerZipCode().ifPresent(z -> key.append(":zip:").append(z));
        c.sellingLocation().ifPresent(l -> key.append(":loc:").append(l.toUpperCase()));
        key.append(":sort:").append(c.sortBy()).append(":").append(c.sortDirection());
        key.append(":page:").append(c.page()).append(":size:").append(c.size());
        return key.toString();
    }
}
```

---

## Phase 5: Search Controller

**New File:** `apps/product-service/src/main/java/org/example/product/controller/ProductSearchController.java`

```java
package org.example.product.controller;

import org.example.platform.logging.StructuredLogger;
import org.example.platform.logging.data.*;
import org.example.platform.webflux.context.*;
import org.example.product.domain.*;
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

    public ProductSearchController(ProductSearchService searchService,
            SearchRequestValidator validator, StructuredLogger structuredLogger) {
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
            @RequestParam(required = false) String customerZipCode,
            @RequestParam(required = false) String sellingLocation,
            @RequestParam(defaultValue = "relevance") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);
        SearchCriteria criteria = new SearchCriteria(q,
            Optional.ofNullable(minPrice), Optional.ofNullable(maxPrice),
            Optional.ofNullable(minAvailability), Optional.ofNullable(inStockOnly),
            Optional.ofNullable(category), Optional.ofNullable(customerZipCode),
            Optional.ofNullable(sellingLocation), sortBy, parseSortDirection(sortDirection),
            page, size);

        return Mono.deferContextual(ctx -> {
            structuredLogger.logInboundRequest(LOGGER_NAME, new RequestLogData("GET", "/products/search", q));
            return validator.validate(criteria)
                .then(searchService.search(criteria))
                .doOnSuccess(r -> structuredLogger.logOutboundResponse(LOGGER_NAME,
                    new ResponseLogData(HttpStatus.OK.value(), r)));
        }).contextWrite(ctx -> ctx.put(ContextKeys.REQUEST_METADATA, metadata));
    }

    @GetMapping("/suggestions")
    public Mono<List<String>> getSuggestions(
            @RequestParam String prefix,
            @RequestParam(defaultValue = "10") int limit,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);
        return Mono.deferContextual(ctx ->
            searchService.getSuggestions(prefix, Math.min(limit, 20))
        ).contextWrite(ctx -> ctx.put(ContextKeys.REQUEST_METADATA, metadata));
    }

    private SortDirection parseSortDirection(String direction) {
        try { return SortDirection.valueOf(direction.toUpperCase()); }
        catch (IllegalArgumentException e) { return SortDirection.DESC; }
    }
}
```

---

## Phase 6: Configuration

### 6.1 SearchCacheProperties

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

    public Duration getSearchTtl() { return searchTtl; }
    public void setSearchTtl(Duration searchTtl) { this.searchTtl = searchTtl; }
    public Duration getSuggestionsTtl() { return suggestionsTtl; }
    public void setSuggestionsTtl(Duration suggestionsTtl) { this.suggestionsTtl = suggestionsTtl; }
}
```

### 6.2 WebClient Bean

**Update:** `ProductServiceConfig.java`

```java
@Bean
public WebClient catalogWebClient(
        @Value("${app.services.catalog.base-url}") String catalogBaseUrl,
        WebClientLoggingFilter loggingFilter) {
    return WebClient.builder()
        .baseUrl(catalogBaseUrl)
        .filter(loggingFilter.create("catalogsearchrepository"))
        .build();
}
```

### 6.3 Application Configuration

**Update:** `application.yml`

```yaml
app:
  services:
    catalog:
      base-url: ${CATALOG_BASE_URL:http://localhost:8081}

cache:
  search:
    search-ttl: 5m
    suggestions-ttl: 1h

resilience4j:
  circuitbreaker:
    instances:
      catalog:
        registerHealthIndicator: true
        slidingWindowSize: 10
        permittedNumberOfCallsInHalfOpenState: 3
        waitDurationInOpenState: 10s
        failureRateThreshold: 50
  retry:
    instances:
      catalog:
        maxAttempts: 3
        waitDuration: 100ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
  timelimiter:
    instances:
      catalog:
        timeoutDuration: 3s
  bulkhead:
    instances:
      catalog:
        maxConcurrentCalls: 25
        maxWaitDuration: 0
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `domain/SearchCriteria.java` | Search criteria record |
| CREATE | `domain/SortDirection.java` | Sort direction enum |
| CREATE | `domain/SearchResponse.java` | Paginated response |
| CREATE | `domain/SearchProduct.java` | Search result product |
| CREATE | `validation/SearchRequestValidator.java` | Request validation |
| CREATE | `config/SearchCacheProperties.java` | Cache configuration |
| CREATE | `repository/catalog/CatalogSearchRepository.java` | Catalog search repository |
| CREATE | `service/ProductSearchService.java` | Search service |
| CREATE | `controller/ProductSearchController.java` | REST controller |
| MODIFY | `ProductServiceConfig.java` | Add catalog WebClient |
| MODIFY | `application.yml` | Add catalog config |

---

## Checklist

- [x] Phase 1: Domain models created
- [x] Phase 2: Validation implemented
- [x] Phase 3: Catalog search repository created
- [x] Phase 4: Search service created
- [x] Phase 5: Controller created
- [x] Phase 6: Configuration updated
- [x] Build passes
- [x] Ready for 012_PRODUCT_SEARCH_TESTING
