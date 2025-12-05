package org.example.cart.controller;

import org.example.cart.dto.CreateCartRequest;
import org.example.cart.model.Cart;
import org.example.cart.service.CartService;
import org.example.cart.validation.CartRequestValidator;
import org.example.platform.logging.RequestLogData;
import org.example.platform.logging.ResponseLogData;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Controller for cart lifecycle operations. */
@RestController
@RequestMapping("/carts")
public class CartController {

  private static final String LOGGER_NAME = "cartcontroller";

  private final CartService cartService;
  private final CartRequestValidator validator;
  private final StructuredLogger structuredLogger;

  public CartController(
      CartService cartService, CartRequestValidator validator, StructuredLogger structuredLogger) {
    this.cartService = cartService;
    this.validator = validator;
    this.structuredLogger = structuredLogger;
  }

  /** Create a new cart. */
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasAuthority('SCOPE_cart:write')")
  public Mono<Cart> createCart(
      @RequestBody CreateCartRequest request,
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
                  .validateCreateCart(request, storeNumber, orderNumber, userId, sessionId)
                  .then(cartService.createCart(request.storeNumber(), request.customerId()))
                  .doOnSuccess(cart -> logResponse(ctx, httpRequest, 201, cart));
            })
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
  }

  /** Get a cart by ID. */
  @GetMapping("/{cartId}")
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Mono<Cart> getCart(
      @PathVariable String cartId,
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
                  .validateGetCart(cartId, storeNumber, orderNumber, userId, sessionId)
                  .then(cartService.getCart(cartId))
                  .doOnSuccess(cart -> logResponse(ctx, httpRequest, 200, cart));
            })
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
  }

  /** Find carts by store number. */
  @GetMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Flux<Cart> findCarts(
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
                  .validateFindCarts(storeNumber, headerStoreNumber, orderNumber, userId, sessionId)
                  .thenMany(cartService.findByStoreNumber(storeNumber));
            })
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
  }

  /** Delete a cart. */
  @DeleteMapping("/{cartId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("hasAuthority('SCOPE_cart:write')")
  public Mono<Void> deleteCart(
      @PathVariable String cartId,
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
                  .validateGetCart(cartId, storeNumber, orderNumber, userId, sessionId)
                  .then(cartService.deleteCart(cartId))
                  .doOnSuccess(v -> logResponse(ctx, httpRequest, 204, null));
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
