package org.example.product.client;

import java.math.BigDecimal;
import java.util.List;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.resilience.ReactiveResilience;
import org.example.product.domain.SearchCriteria;
import org.example.product.domain.SearchProduct;
import org.example.product.domain.SearchResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class CatalogServiceClientImpl implements CatalogServiceClient {

    private static final String RESILIENCE_NAME = "catalog";
    private static final String LOGGER_NAME = "catalogserviceclient";

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

    @Override
    public Mono<List<String>> getSuggestions(String prefix, int limit) {
        Mono<SuggestionsResponse> call =
                catalogWebClient
                        .get()
                        .uri(
                                b ->
                                        b.path("/catalog/suggestions")
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
        return new CatalogSearchRequest(
                c.query(),
                c.minPrice().orElse(null),
                c.maxPrice().orElse(null),
                c.minAvailability().orElse(null),
                c.inStockOnly().orElse(null),
                c.category().orElse(null),
                c.customerZipCode().orElse(null),
                c.sellingLocation().orElse(null),
                c.sortBy(),
                c.sortDirection().name(),
                c.page(),
                c.size());
    }

    private SearchResponse<SearchProduct> toSearchResponse(CatalogSearchResponse r) {
        return new SearchResponse<>(
                r.products().stream()
                        .map(
                                p ->
                                        new SearchProduct(
                                                p.sku(),
                                                p.description(),
                                                p.price(),
                                                p.availableQuantity(),
                                                p.category(),
                                                p.relevanceScore()))
                        .toList(),
                r.totalCount(),
                r.totalPages(),
                r.page(),
                r.size(),
                r.query(),
                r.searchTimeMs());
    }

    private Mono<SearchResponse<SearchProduct>> handleSearchError(Throwable t) {
        return Mono.deferContextual(
                ctx -> {
                    String cbState = resilience.getCircuitBreakerState(RESILIENCE_NAME).name();
                    structuredLogger.logError(ctx, LOGGER_NAME, RESILIENCE_NAME, t, cbState);
                    return Mono.error(t);
                });
    }

    private Mono<List<String>> handleSuggestionsError(Throwable t) {
        return Mono.deferContextual(
                ctx -> {
                    String cbState = resilience.getCircuitBreakerState(RESILIENCE_NAME).name();
                    structuredLogger.logError(ctx, LOGGER_NAME, RESILIENCE_NAME, t, cbState);
                    return Mono.just(List.of());
                });
    }

    // Internal DTOs for Catalog Service API
    private record CatalogSearchRequest(
            String query,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minAvailability,
            Boolean inStockOnly,
            String category,
            String customerZipCode,
            String sellingLocation,
            String sortBy,
            String sortDirection,
            int page,
            int size) {}

    private record CatalogSearchResponse(
            List<CatalogProduct> products,
            long totalCount,
            int totalPages,
            int page,
            int size,
            String query,
            long searchTimeMs) {}

    private record CatalogProduct(
            long sku,
            String description,
            BigDecimal price,
            int availableQuantity,
            String category,
            double relevanceScore) {}

    private record SuggestionsResponse(List<String> suggestions) {}
}
