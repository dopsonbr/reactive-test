package org.example.product.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.example.platform.logging.RequestLogData;
import org.example.platform.logging.ResponseLogData;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.webflux.context.ContextKeys;
import org.example.product.domain.SearchCriteria;
import org.example.product.domain.SearchProduct;
import org.example.product.domain.SearchResponse;
import org.example.product.domain.SortDirection;
import org.example.product.service.ProductSearchService;
import org.example.product.validation.SearchRequestValidator;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/products/search")
public class ProductSearchController {

  private static final String LOGGER_NAME = "productsearchcontroller";

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
  @PreAuthorize("hasAuthority('SCOPE_product:read')")
  public Mono<SearchResponse<SearchProduct>> search(
      @RequestParam(required = false, defaultValue = "") String q,
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
      @RequestHeader HttpHeaders headers,
      @AuthenticationPrincipal Jwt jwt,
      ServerHttpRequest request) {

    SearchCriteria criteria =
        new SearchCriteria(
            q,
            Optional.ofNullable(minPrice),
            Optional.ofNullable(maxPrice),
            Optional.ofNullable(minAvailability),
            Optional.ofNullable(inStockOnly),
            Optional.ofNullable(category),
            Optional.ofNullable(customerZipCode),
            Optional.ofNullable(sellingLocation),
            sortBy,
            parseSortDirection(sortDirection),
            page,
            size);

    return validator
        .validate(criteria)
        .then(
            Mono.deferContextual(
                ctx -> {
                  String subject = jwt != null ? jwt.getSubject() : "unknown";
                  RequestLogData requestData =
                      new RequestLogData(
                          "/products/search",
                          request.getURI().getPath(),
                          request.getMethod().name(),
                          subject);
                  structuredLogger.logRequest(ctx, LOGGER_NAME, requestData);

                  return searchService
                      .search(criteria)
                      .doOnSuccess(
                          response -> {
                            ResponseLogData responseData =
                                new ResponseLogData(
                                    "/products/search",
                                    request.getURI().getPath(),
                                    request.getMethod().name(),
                                    200,
                                    response);
                            structuredLogger.logResponse(ctx, LOGGER_NAME, responseData);
                          });
                }))
        .contextWrite(ContextKeys.fromHeaders(headers));
  }

  @GetMapping("/suggestions")
  @PreAuthorize("hasAuthority('SCOPE_product:read')")
  public Mono<List<String>> getSuggestions(
      @RequestParam String prefix,
      @RequestParam(defaultValue = "10") int limit,
      @RequestHeader HttpHeaders headers,
      @AuthenticationPrincipal Jwt jwt,
      ServerHttpRequest request) {

    return Mono.deferContextual(
            ctx -> {
              String subject = jwt != null ? jwt.getSubject() : "unknown";
              RequestLogData requestData =
                  new RequestLogData(
                      "/products/search/suggestions",
                      request.getURI().getPath(),
                      request.getMethod().name(),
                      subject);
              structuredLogger.logRequest(ctx, LOGGER_NAME, requestData);

              return searchService
                  .getSuggestions(prefix, Math.min(limit, 20))
                  .doOnSuccess(
                      suggestions -> {
                        ResponseLogData responseData =
                            new ResponseLogData(
                                "/products/search/suggestions",
                                request.getURI().getPath(),
                                request.getMethod().name(),
                                200,
                                suggestions);
                        structuredLogger.logResponse(ctx, LOGGER_NAME, responseData);
                      });
            })
        .contextWrite(ContextKeys.fromHeaders(headers));
  }

  private SortDirection parseSortDirection(String direction) {
    try {
      return SortDirection.valueOf(direction.toUpperCase());
    } catch (IllegalArgumentException e) {
      return SortDirection.DESC;
    }
  }
}
