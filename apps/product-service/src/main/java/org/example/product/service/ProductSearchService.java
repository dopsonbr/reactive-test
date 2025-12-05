package org.example.product.service;

import java.util.List;
import org.example.platform.cache.ReactiveCacheService;
import org.example.platform.logging.StructuredLogger;
import org.example.product.config.SearchCacheProperties;
import org.example.product.domain.SearchCriteria;
import org.example.product.domain.SearchProduct;
import org.example.product.domain.SearchResponse;
import org.example.product.repository.catalog.CatalogSearchRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ProductSearchService {

  private static final String LOGGER_NAME = "productsearchservice";

  private final CatalogSearchRepository catalogSearchRepository;
  private final ReactiveCacheService cacheService;
  private final SearchCacheProperties cacheProperties;
  private final StructuredLogger structuredLogger;

  public ProductSearchService(
      CatalogSearchRepository catalogSearchRepository,
      ReactiveCacheService cacheService,
      SearchCacheProperties cacheProperties,
      StructuredLogger structuredLogger) {
    this.catalogSearchRepository = catalogSearchRepository;
    this.cacheService = cacheService;
    this.cacheProperties = cacheProperties;
    this.structuredLogger = structuredLogger;
  }

  @SuppressWarnings("unchecked")
  public Mono<SearchResponse<SearchProduct>> search(SearchCriteria criteria) {
    String cacheKey = buildSearchCacheKey(criteria);
    return cacheService
        .get(cacheKey, SearchResponse.class)
        .map(response -> (SearchResponse<SearchProduct>) response)
        .switchIfEmpty(Mono.defer(() -> fetchAndCacheSearch(criteria, cacheKey)));
  }

  @SuppressWarnings("unchecked")
  public Mono<List<String>> getSuggestions(String prefix, int limit) {
    String cacheKey = "suggestions:" + prefix.toLowerCase().trim() + ":limit:" + limit;
    return cacheService
        .get(cacheKey, List.class)
        .map(list -> (List<String>) list)
        .switchIfEmpty(Mono.defer(() -> fetchAndCacheSuggestions(prefix, limit, cacheKey)));
  }

  private Mono<SearchResponse<SearchProduct>> fetchAndCacheSearch(
      SearchCriteria criteria, String cacheKey) {
    return Mono.deferContextual(
        ctx -> {
          structuredLogger.logMessage(
              ctx, LOGGER_NAME, "Starting product search for query: " + criteria.query());
          return catalogSearchRepository
              .search(criteria)
              .flatMap(
                  response ->
                      cacheService
                          .put(cacheKey, response, cacheProperties.getSearchTtl())
                          .thenReturn(response))
              .doOnSuccess(
                  response ->
                      structuredLogger.logMessage(
                          ctx,
                          LOGGER_NAME,
                          "Search completed with " + response.totalItems() + " results"));
        });
  }

  private Mono<List<String>> fetchAndCacheSuggestions(String prefix, int limit, String cacheKey) {
    return catalogSearchRepository
        .getSuggestions(prefix, limit)
        .flatMap(
            suggestions ->
                cacheService
                    .put(cacheKey, suggestions, cacheProperties.getSuggestionsTtl())
                    .thenReturn(suggestions));
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
