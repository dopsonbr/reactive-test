package org.example.cart.graphql;

import java.util.List;
import org.example.cart.graphql.validation.GraphQLInputValidator;
import org.example.cart.model.Cart;
import org.example.cart.service.CartService;
import org.example.model.customer.CartCustomer;
import org.example.model.discount.AppliedDiscount;
import org.example.model.fulfillment.Fulfillment;
import org.example.model.product.CartProduct;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * GraphQL query resolver for cart operations. Provides read-only access to cart data with parity to
 * REST GET endpoints.
 */
@Controller
public class CartQueryController {

  private final CartService cartService;
  private final GraphQLInputValidator validator;

  public CartQueryController(CartService cartService, GraphQLInputValidator validator) {
    this.cartService = cartService;
    this.validator = validator;
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Mono<Cart> cart(@Argument String id) {
    return validator
        .validateCartId(id)
        .then(cartService.getCart(id))
        .onErrorResume(
            org.springframework.web.server.ResponseStatusException.class,
            e -> {
              if (e.getStatusCode().value() == 404) {
                return Mono.empty(); // Return null for non-existent cart per GraphQL
                // convention
              }
              return Mono.error(e);
            });
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Flux<Cart> cartsByStore(@Argument int storeNumber) {
    return validator
        .validateStoreNumber(storeNumber)
        .thenMany(cartService.findByStoreNumber(storeNumber));
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Flux<Cart> cartsByCustomer(@Argument String customerId) {
    return validator
        .validateCustomerId(customerId)
        .thenMany(cartService.findByCustomerId(customerId));
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Mono<CartProduct> cartProduct(@Argument String cartId, @Argument String sku) {
    return validator
        .validateProductAccess(cartId, sku)
        .then(cartService.getProduct(cartId, Long.parseLong(sku)))
        .onErrorResume(
            org.springframework.web.server.ResponseStatusException.class,
            e -> {
              if (e.getStatusCode().value() == 404) {
                return Mono.empty();
              }
              return Mono.error(e);
            });
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Mono<List<CartProduct>> cartProducts(@Argument String cartId) {
    return validator.validateCartId(cartId).then(cartService.getProducts(cartId));
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Mono<AppliedDiscount> cartDiscount(@Argument String cartId, @Argument String discountId) {
    return validator
        .validateDiscountAccess(cartId, discountId)
        .then(cartService.getDiscount(cartId, discountId))
        .onErrorResume(
            org.springframework.web.server.ResponseStatusException.class,
            e -> {
              if (e.getStatusCode().value() == 404) {
                return Mono.empty();
              }
              return Mono.error(e);
            });
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Mono<List<AppliedDiscount>> cartDiscounts(@Argument String cartId) {
    return validator.validateCartId(cartId).then(cartService.getDiscounts(cartId));
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Mono<Fulfillment> cartFulfillment(
      @Argument String cartId, @Argument String fulfillmentId) {
    return validator
        .validateFulfillmentAccess(cartId, fulfillmentId)
        .then(cartService.getFulfillment(cartId, fulfillmentId))
        .onErrorResume(
            org.springframework.web.server.ResponseStatusException.class,
            e -> {
              if (e.getStatusCode().value() == 404) {
                return Mono.empty();
              }
              return Mono.error(e);
            });
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Mono<List<Fulfillment>> cartFulfillments(@Argument String cartId) {
    return validator.validateCartId(cartId).then(cartService.getFulfillments(cartId));
  }

  @QueryMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Mono<CartCustomer> cartCustomer(@Argument String cartId) {
    return validator
        .validateCartId(cartId)
        .then(cartService.getCustomer(cartId))
        .onErrorResume(
            org.springframework.web.server.ResponseStatusException.class,
            e -> {
              if (e.getStatusCode().value() == 404) {
                return Mono.empty();
              }
              return Mono.error(e);
            });
  }
}
