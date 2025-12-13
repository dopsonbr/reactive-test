package org.example.checkout.controller;

import org.example.checkout.dto.CheckoutSummaryResponse;
import org.example.checkout.dto.CompleteCheckoutRequest;
import org.example.checkout.dto.InitiateCheckoutRequest;
import org.example.checkout.dto.OrderResponse;
import org.example.checkout.service.CheckoutService;
import org.example.checkout.validation.CheckoutRequestValidator;
import org.example.platform.logging.RequestLogData;
import org.example.platform.logging.ResponseLogData;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.example.platform.webflux.context.RequestMetadataExtractor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/** Controller for checkout and order operations. */
@RestController
public class CheckoutController {

  private static final String LOGGER_NAME = "checkoutcontroller";

  private final CheckoutService checkoutService;
  private final CheckoutRequestValidator validator;
  private final StructuredLogger structuredLogger;

  public CheckoutController(
      CheckoutService checkoutService,
      CheckoutRequestValidator validator,
      StructuredLogger structuredLogger) {
    this.checkoutService = checkoutService;
    this.validator = validator;
    this.structuredLogger = structuredLogger;
  }

  /**
   * Initiate checkout process.
   *
   * <p>Validates cart, calculates discounts, creates fulfillment reservation, and returns checkout
   * summary for payment.
   */
  @PostMapping("/checkout/initiate")
  @ResponseStatus(HttpStatus.OK)
  @PreAuthorize("hasAuthority('SCOPE_checkout:write')")
  public Mono<CheckoutSummaryResponse> initiateCheckout(
      @RequestBody InitiateCheckoutRequest request,
      @RequestHeader HttpHeaders headers,
      ServerHttpRequest httpRequest) {
    RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);

    return Mono.deferContextual(
            ctx -> {
              logRequest(ctx, httpRequest);
              return validator
                  .validateInitiateCheckout(
                      request,
                      metadata.storeNumber(),
                      metadata.orderNumber(),
                      metadata.userId(),
                      metadata.sessionId())
                  .then(checkoutService.initiateCheckout(request, metadata.storeNumber()))
                  .doOnSuccess(response -> logResponse(ctx, httpRequest, 200, response));
            })
        .contextWrite(ContextKeys.fromHeaders(headers));
  }

  /**
   * Complete checkout with payment.
   *
   * <p>Processes payment and creates the order.
   */
  @PostMapping("/checkout/complete")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasAuthority('SCOPE_checkout:write')")
  public Mono<OrderResponse> completeCheckout(
      @RequestBody CompleteCheckoutRequest request,
      @RequestHeader HttpHeaders headers,
      ServerHttpRequest httpRequest) {
    RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);

    return Mono.deferContextual(
            ctx -> {
              logRequest(ctx, httpRequest);
              return validator
                  .validateCompleteCheckout(
                      request,
                      metadata.storeNumber(),
                      metadata.orderNumber(),
                      metadata.userId(),
                      metadata.sessionId())
                  .then(checkoutService.completeCheckout(request, metadata.storeNumber()))
                  .doOnSuccess(response -> logResponse(ctx, httpRequest, 201, response));
            })
        .contextWrite(ContextKeys.fromHeaders(headers));
  }

  // NOTE: Order query APIs (/orders, /orders/{orderId}) have been removed.
  // Order querying is now handled by order-service, which consumes the OrderCompleted events
  // published by checkout-service.

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
