package org.example.cart.graphql;

import java.util.List;
import java.util.stream.Collectors;
import org.example.cart.graphql.input.AddFulfillmentInput;
import org.example.cart.graphql.input.AddProductInput;
import org.example.cart.graphql.input.ApplyDiscountInput;
import org.example.cart.graphql.input.CreateCartInput;
import org.example.cart.graphql.input.SetCustomerInput;
import org.example.cart.graphql.input.UpdateFulfillmentInput;
import org.example.cart.graphql.input.UpdateProductInput;
import org.example.cart.graphql.validation.GraphQLInputValidator;
import org.example.cart.model.Cart;
import org.example.cart.service.CartService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Mono;

/**
 * GraphQL mutation resolver for cart operations. Provides write operations with parity to REST
 * POST/PUT/DELETE endpoints.
 */
@Controller
public class CartMutationController {

    private final CartService cartService;
    private final GraphQLInputValidator validator;

    public CartMutationController(CartService cartService, GraphQLInputValidator validator) {
        this.cartService = cartService;
        this.validator = validator;
    }

    // ─────────────────────────────────────────────────────────────────
    // Cart Lifecycle
    // ─────────────────────────────────────────────────────────────────

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> createCart(@Argument CreateCartInput input) {
        return validator
                .validateCreateCart(input)
                .then(cartService.createCart(input.storeNumber(), input.customerId()));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Boolean> deleteCart(@Argument String id) {
        return validator.validateCartId(id).then(cartService.deleteCart(id)).thenReturn(true);
    }

    // ─────────────────────────────────────────────────────────────────
    // Product Operations
    // ─────────────────────────────────────────────────────────────────

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> addProduct(@Argument String cartId, @Argument AddProductInput input) {
        return validator
                .validateAddProduct(cartId, input)
                .then(
                        cartService.addProduct(
                                cartId, Long.parseLong(input.sku()), input.quantity()));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> updateProduct(
            @Argument String cartId, @Argument String sku, @Argument UpdateProductInput input) {
        return validator
                .validateUpdateProduct(cartId, sku, input)
                .then(cartService.updateProduct(cartId, Long.parseLong(sku), input.quantity()));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> removeProduct(@Argument String cartId, @Argument String sku) {
        return validator
                .validateProductAccess(cartId, sku)
                .then(cartService.removeProduct(cartId, Long.parseLong(sku)));
    }

    // ─────────────────────────────────────────────────────────────────
    // Discount Operations
    // ─────────────────────────────────────────────────────────────────

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> applyDiscount(@Argument String cartId, @Argument ApplyDiscountInput input) {
        return validator
                .validateApplyDiscount(cartId, input)
                .then(cartService.applyDiscount(cartId, input.code()));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> removeDiscount(@Argument String cartId, @Argument String discountId) {
        return validator
                .validateDiscountAccess(cartId, discountId)
                .then(cartService.removeDiscount(cartId, discountId));
    }

    // ─────────────────────────────────────────────────────────────────
    // Fulfillment Operations
    // ─────────────────────────────────────────────────────────────────

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> addFulfillment(@Argument String cartId, @Argument AddFulfillmentInput input) {
        List<Long> skus = input.skus().stream().map(Long::parseLong).collect(Collectors.toList());
        return validator
                .validateAddFulfillment(cartId, input)
                .then(cartService.addFulfillment(cartId, input.type(), skus));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> updateFulfillment(
            @Argument String cartId,
            @Argument String fulfillmentId,
            @Argument UpdateFulfillmentInput input) {
        List<Long> skus = input.skus().stream().map(Long::parseLong).collect(Collectors.toList());
        return validator
                .validateUpdateFulfillment(cartId, fulfillmentId, input)
                .then(cartService.updateFulfillment(cartId, fulfillmentId, input.type(), skus));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> removeFulfillment(@Argument String cartId, @Argument String fulfillmentId) {
        return validator
                .validateFulfillmentAccess(cartId, fulfillmentId)
                .then(cartService.removeFulfillment(cartId, fulfillmentId));
    }

    // ─────────────────────────────────────────────────────────────────
    // Customer Operations (beyond REST parity)
    // ─────────────────────────────────────────────────────────────────

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> setCustomer(@Argument String cartId, @Argument SetCustomerInput input) {
        return validator
                .validateSetCustomer(cartId, input)
                .then(
                        cartService.setCustomer(
                                cartId, input.customerId(), input.name(), input.email()));
    }

    @MutationMapping
    @PreAuthorize("hasAuthority('SCOPE_cart:write')")
    public Mono<Cart> removeCustomer(@Argument String cartId) {
        return validator.validateCartId(cartId).then(cartService.removeCustomer(cartId));
    }
}
