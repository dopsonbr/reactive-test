package org.example.cart.controller;

import java.util.List;
import org.example.cart.dto.ApplyDiscountRequest;
import org.example.cart.model.Cart;
import org.example.cart.service.CartService;
import org.example.cart.validation.CartRequestValidator;
import org.example.model.discount.AppliedDiscount;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/** Controller for cart discount operations. */
@RestController
@RequestMapping("/carts/{cartId}/discounts")
public class CartDiscountController {

    private final CartService cartService;
    private final CartRequestValidator validator;

    public CartDiscountController(CartService cartService, CartRequestValidator validator) {
        this.cartService = cartService;
        this.validator = validator;
    }

    /** List all discounts on the cart. */
    @GetMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Mono<List<AppliedDiscount>> getDiscounts(
            @PathVariable String cartId,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return validator
                .validateGetCart(cartId, storeNumber, orderNumber, userId, sessionId)
                .then(cartService.getDiscounts(cartId))
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /** Apply a discount to the cart. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> applyDiscount(
            @PathVariable String cartId,
            @RequestBody ApplyDiscountRequest request,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return validator
                .validateApplyDiscount(cartId, request, storeNumber, orderNumber, userId, sessionId)
                .then(cartService.applyDiscount(cartId, request.code()))
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /** Get a specific discount from the cart. */
    @GetMapping("/{discountId}")
    @PreAuthorize("hasAuthority('SCOPE_cart:read')")
    public Mono<AppliedDiscount> getDiscount(
            @PathVariable String cartId,
            @PathVariable String discountId,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return validator
                .validateDiscountAccess(
                        cartId, discountId, storeNumber, orderNumber, userId, sessionId)
                .then(cartService.getDiscount(cartId, discountId))
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /** Remove a discount from the cart. */
    @DeleteMapping("/{discountId}")
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> removeDiscount(
            @PathVariable String cartId,
            @PathVariable String discountId,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return validator
                .validateDiscountAccess(
                        cartId, discountId, storeNumber, orderNumber, userId, sessionId)
                .then(cartService.removeDiscount(cartId, discountId))
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }
}
