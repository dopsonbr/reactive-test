package org.example.checkout.controller;

import java.util.UUID;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
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
      @RequestHeader("x-store-number") int storeNumber,
      @RequestHeader("x-order-number") String orderNumber,
      @RequestHeader("x-userid") String userId,
      @RequestHeader("x-sessionid") String sessionId,
      ServerHttpRequest httpRequest) {
    RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

    return Mono.deferContextual(
            ctx -> {
              logRequest(ctx, httpRequest);
              return validator
                  .validateInitiateCheckout(request, storeNumber, orderNumber, userId, sessionId)
                  .then(checkoutService.initiateCheckout(request, storeNumber))
                  .doOnSuccess(response -> logResponse(ctx, httpRequest, 200, response));
            })
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
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
      @RequestHeader("x-store-number") int storeNumber,
      @RequestHeader("x-order-number") String orderNumber,
      @RequestHeader("x-userid") String userId,
      @RequestHeader("x-sessionid") String sessionId,
      ServerHttpRequest httpRequest) {
    RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

    return Mono.deferContextual(
            ctx -> {
              logRequest(ctx, httpRequest);
              return validator
                  .validateCompleteCheckout(request, storeNumber, orderNumber, userId, sessionId)
                  .then(checkoutService.completeCheckout(request, storeNumber))
                  .doOnSuccess(response -> logResponse(ctx, httpRequest, 201, response));
            })
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
  }

  /** Get an order by ID. */
  @GetMapping("/orders/{orderId}")
  @PreAuthorize("hasAuthority('SCOPE_checkout:read')")
  public Mono<OrderResponse> getOrder(
      @PathVariable String orderId,
      @RequestHeader("x-store-number") int storeNumber,
      @RequestHeader("x-order-number") String orderNumber,
      @RequestHeader("x-userid") String userId,
      @RequestHeader("x-sessionid") String sessionId,
      ServerHttpRequest httpRequest) {
    RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

    return Mono.deferContextual(
            ctx -> {
              logRequest(ctx, httpRequest);
              return validator
                  .validateGetOrder(orderId, storeNumber, orderNumber, userId, sessionId)
                  .then(checkoutService.getOrder(UUID.fromString(orderId)))
                  .doOnSuccess(response -> logResponse(ctx, httpRequest, 200, response));
            })
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
  }

  /** List orders by store number. */
  @GetMapping("/orders")
  @PreAuthorize("hasAuthority('SCOPE_checkout:read')")
  public Flux<OrderResponse> listOrders(
      @RequestParam int storeNumber,
      @RequestHeader("x-store-number") int headerStoreNumber,
      @RequestHeader("x-order-number") String orderNumber,
      @RequestHeader("x-userid") String userId,
      @RequestHeader("x-sessionid") String sessionId,
      ServerHttpRequest httpRequest) {
    RequestMetadata metadata =
        new RequestMetadata(headerStoreNumber, orderNumber, userId, sessionId);

    return Flux.deferContextual(
            ctx -> {
              logRequest(ctx, httpRequest);
              return validator
                  .validateListOrders(
                      storeNumber, headerStoreNumber, orderNumber, userId, sessionId)
                  .thenMany(checkoutService.listOrdersByStore(storeNumber));
            })
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
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
