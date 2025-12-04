package org.example.cart.controller;

import java.util.List;
import org.example.cart.dto.AddFulfillmentRequest;
import org.example.cart.dto.UpdateFulfillmentRequest;
import org.example.cart.model.Cart;
import org.example.cart.service.CartService;
import org.example.cart.validation.CartRequestValidator;
import org.example.model.fulfillment.Fulfillment;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/** Controller for cart fulfillment operations. */
@RestController
@RequestMapping("/carts/{cartId}/fulfillments")
public class CartFulfillmentController {

    private final CartService cartService;
    private final CartRequestValidator validator;

    public CartFulfillmentController(CartService cartService, CartRequestValidator validator) {
        this.cartService = cartService;
        this.validator = validator;
    }

    /** List all fulfillments on the cart. */
    @GetMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Mono<List<Fulfillment>> getFulfillments(
            @PathVariable String cartId,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return validator
                .validateGetCart(cartId, storeNumber, orderNumber, userId, sessionId)
                .then(cartService.getFulfillments(cartId))
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /** Add a fulfillment to the cart. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> addFulfillment(
            @PathVariable String cartId,
            @RequestBody AddFulfillmentRequest request,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return validator
                .validateAddFulfillment(
                        cartId, request, storeNumber, orderNumber, userId, sessionId)
                .then(cartService.addFulfillment(cartId, request.type(), request.skus()))
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /** Get a specific fulfillment from the cart. */
    @GetMapping("/{fulfillmentId}")
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Mono<Fulfillment> getFulfillment(
            @PathVariable String cartId,
            @PathVariable String fulfillmentId,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return validator
                .validateFulfillmentAccess(
                        cartId, fulfillmentId, storeNumber, orderNumber, userId, sessionId)
                .then(cartService.getFulfillment(cartId, fulfillmentId))
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /** Update a fulfillment in the cart. */
    @PutMapping("/{fulfillmentId}")
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> updateFulfillment(
            @PathVariable String cartId,
            @PathVariable String fulfillmentId,
            @RequestBody UpdateFulfillmentRequest request,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return validator
                .validateUpdateFulfillment(
                        cartId, fulfillmentId, request, storeNumber, orderNumber, userId, sessionId)
                .then(
                        cartService.updateFulfillment(
                                cartId, fulfillmentId, request.type(), request.skus()))
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /** Remove a fulfillment from the cart. */
    @DeleteMapping("/{fulfillmentId}")
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> removeFulfillment(
            @PathVariable String cartId,
            @PathVariable String fulfillmentId,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return validator
                .validateFulfillmentAccess(
                        cartId, fulfillmentId, storeNumber, orderNumber, userId, sessionId)
                .then(cartService.removeFulfillment(cartId, fulfillmentId))
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }
}
