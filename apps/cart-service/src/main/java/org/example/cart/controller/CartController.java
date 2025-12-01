package org.example.cart.controller;

import org.example.cart.domain.Cart;
import org.example.cart.service.CartService;
import org.example.platform.logging.RequestLogData;
import org.example.platform.logging.ResponseLogData;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;

@RestController
@RequestMapping("/carts")
public class CartController {
    private static final String LOGGER_NAME = "cartcontroller";

    private final CartService cartService;
    private final StructuredLogger structuredLogger;

    public CartController(CartService cartService, StructuredLogger structuredLogger) {
        this.cartService = cartService;
        this.structuredLogger = structuredLogger;
    }

    /**
     * Create a new cart.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Cart> createCart(
        @RequestHeader("x-store-number") int storeNumber,
        @RequestHeader("x-order-number") String orderNumber,
        @RequestHeader("x-userid") String userId,
        @RequestHeader("x-sessionid") String sessionId,
        ServerHttpRequest request
    ) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(ctx -> {
            logRequest(ctx, request);
            return cartService.createCart(userId)
                .doOnSuccess(cart -> logResponse(ctx, request, 201, cart));
        }).contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /**
     * Get a cart by ID.
     */
    @GetMapping("/{cartId}")
    public Mono<Cart> getCart(
        @PathVariable String cartId,
        @RequestHeader("x-store-number") int storeNumber,
        @RequestHeader("x-order-number") String orderNumber,
        @RequestHeader("x-userid") String userId,
        @RequestHeader("x-sessionid") String sessionId,
        ServerHttpRequest request
    ) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(ctx -> {
            logRequest(ctx, request);
            return cartService.getCart(cartId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found")))
                .doOnSuccess(cart -> logResponse(ctx, request, 200, cart));
        }).contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /**
     * Add or update an item in the cart.
     */
    @PutMapping("/{cartId}/items")
    public Mono<Cart> addItem(
        @PathVariable String cartId,
        @RequestBody AddItemRequest body,
        @RequestHeader("x-store-number") int storeNumber,
        @RequestHeader("x-order-number") String orderNumber,
        @RequestHeader("x-userid") String userId,
        @RequestHeader("x-sessionid") String sessionId,
        ServerHttpRequest request
    ) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(ctx -> {
            logRequest(ctx, request);
            return cartService.addItem(cartId, body.sku(), body.quantity(), body.price())
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found")))
                .doOnSuccess(cart -> logResponse(ctx, request, 200, cart));
        }).contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /**
     * Remove an item from the cart.
     */
    @DeleteMapping("/{cartId}/items/{sku}")
    public Mono<Cart> removeItem(
        @PathVariable String cartId,
        @PathVariable String sku,
        @RequestHeader("x-store-number") int storeNumber,
        @RequestHeader("x-order-number") String orderNumber,
        @RequestHeader("x-userid") String userId,
        @RequestHeader("x-sessionid") String sessionId,
        ServerHttpRequest request
    ) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(ctx -> {
            logRequest(ctx, request);
            return cartService.removeItem(cartId, sku)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found")))
                .doOnSuccess(cart -> logResponse(ctx, request, 200, cart));
        }).contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /**
     * Get cart summary with totals.
     */
    @GetMapping("/{cartId}/summary")
    public Mono<CartSummary> getCartSummary(
        @PathVariable String cartId,
        @RequestHeader("x-store-number") int storeNumber,
        @RequestHeader("x-order-number") String orderNumber,
        @RequestHeader("x-userid") String userId,
        @RequestHeader("x-sessionid") String sessionId,
        ServerHttpRequest request
    ) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(ctx -> {
            logRequest(ctx, request);
            return cartService.getCart(cartId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found")))
                .map(cart -> new CartSummary(cart.id(), cart.itemCount(), cart.total()))
                .doOnSuccess(summary -> logResponse(ctx, request, 200, summary));
        }).contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    private void logRequest(reactor.util.context.ContextView ctx, ServerHttpRequest request) {
        RequestLogData requestData = new RequestLogData(
            request.getPath().value(),
            request.getURI().getPath(),
            request.getMethod().name(),
            null
        );
        structuredLogger.logRequest(ctx, LOGGER_NAME, requestData);
    }

    private void logResponse(reactor.util.context.ContextView ctx, ServerHttpRequest request, int status, Object body) {
        ResponseLogData responseData = new ResponseLogData(
            request.getPath().value(),
            request.getURI().getPath(),
            request.getMethod().name(),
            status,
            body
        );
        structuredLogger.logResponse(ctx, LOGGER_NAME, responseData);
    }

    // Request/Response DTOs
    public record AddItemRequest(String sku, int quantity, BigDecimal price) {}
    public record CartSummary(String cartId, int itemCount, BigDecimal total) {}
}
