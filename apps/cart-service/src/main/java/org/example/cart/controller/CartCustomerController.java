package org.example.cart.controller;

import org.example.cart.domain.Cart;
import org.example.cart.service.CartService;
import org.example.cart.validation.CartRequestValidator;
import org.example.platform.logging.RequestLogData;
import org.example.platform.logging.ResponseLogData;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.example.platform.webflux.context.RequestMetadataExtractor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

/**
 * Controller for finding carts by customer ID.
 *
 * <p>This controller provides the ability to retrieve all carts belonging to a specific customer.
 */
@RestController
@RequestMapping("/customers/{customerId}/carts")
public class CartCustomerController {

  private static final String LOGGER_NAME = "cartcustomercontroller";

  private final CartService cartService;
  private final CartRequestValidator validator;
  private final StructuredLogger structuredLogger;

  public CartCustomerController(
      CartService cartService, CartRequestValidator validator, StructuredLogger structuredLogger) {
    this.cartService = cartService;
    this.validator = validator;
    this.structuredLogger = structuredLogger;
  }

  /** Find all carts for a customer. */
  @GetMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Flux<Cart> findCartsByCustomerId(
      @PathVariable String customerId,
      @RequestHeader HttpHeaders headers,
      ServerHttpRequest httpRequest) {
    RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);

    return Flux.deferContextual(
            ctx -> {
              logRequest(ctx, httpRequest);
              return validator
                  .validateFindCartsByCustomerId(
                      customerId,
                      metadata.storeNumber(),
                      metadata.orderNumber(),
                      metadata.userId(),
                      metadata.sessionId())
                  .thenMany(cartService.findByCustomerId(customerId));
            })
        .contextWrite(ContextKeys.fromHeaders(headers));
  }

  private void logRequest(reactor.util.context.ContextView ctx, ServerHttpRequest request) {
    RequestLogData requestData =
        new RequestLogData(
            request.getPath().value(),
            request.getURI().getPath(),
            request.getMethod().name(),
            null);
    structuredLogger.logRequest(ctx, LOGGER_NAME, requestData);
  }

  private void logResponse(
      reactor.util.context.ContextView ctx, ServerHttpRequest request, int status, Object body) {
    ResponseLogData responseData =
        new ResponseLogData(
            request.getPath().value(),
            request.getURI().getPath(),
            request.getMethod().name(),
            status,
            body);
    structuredLogger.logResponse(ctx, LOGGER_NAME, responseData);
  }
}
