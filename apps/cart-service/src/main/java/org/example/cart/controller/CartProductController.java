package org.example.cart.controller;

import java.util.List;
import org.example.cart.dto.AddProductRequest;
import org.example.cart.dto.UpdateProductRequest;
import org.example.cart.model.Cart;
import org.example.cart.service.CartService;
import org.example.cart.validation.CartRequestValidator;
import org.example.model.product.CartProduct;
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

/** Controller for cart product operations. */
@RestController
@RequestMapping("/carts/{cartId}/products")
public class CartProductController {

  private final CartService cartService;
  private final CartRequestValidator validator;

  public CartProductController(CartService cartService, CartRequestValidator validator) {
    this.cartService = cartService;
    this.validator = validator;
  }

  /** List all products in the cart. */
  @GetMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Mono<List<CartProduct>> getProducts(
      @PathVariable String cartId,
      @RequestHeader("x-store-number") int storeNumber,
      @RequestHeader("x-order-number") String orderNumber,
      @RequestHeader("x-userid") String userId,
      @RequestHeader("x-sessionid") String sessionId) {
    RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

    return validator
        .validateGetCart(cartId, storeNumber, orderNumber, userId, sessionId)
        .then(cartService.getProducts(cartId))
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
  }

  /** Add a product to the cart. */
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasAuthority('SCOPE_cart:write')")
  public Mono<Cart> addProduct(
      @PathVariable String cartId,
      @RequestBody AddProductRequest request,
      @RequestHeader("x-store-number") int storeNumber,
      @RequestHeader("x-order-number") String orderNumber,
      @RequestHeader("x-userid") String userId,
      @RequestHeader("x-sessionid") String sessionId) {
    RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

    return validator
        .validateAddProduct(cartId, request, storeNumber, orderNumber, userId, sessionId)
        .then(cartService.addProduct(cartId, request.sku(), request.quantity()))
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
  }

  /** Get a specific product from the cart. */
  @GetMapping("/{sku}")
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Mono<CartProduct> getProduct(
      @PathVariable String cartId,
      @PathVariable long sku,
      @RequestHeader("x-store-number") int storeNumber,
      @RequestHeader("x-order-number") String orderNumber,
      @RequestHeader("x-userid") String userId,
      @RequestHeader("x-sessionid") String sessionId) {
    RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

    return validator
        .validateProductAccess(cartId, sku, storeNumber, orderNumber, userId, sessionId)
        .then(cartService.getProduct(cartId, sku))
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
  }

  /** Update a product quantity in the cart. */
  @PutMapping("/{sku}")
  @PreAuthorize("hasAuthority('SCOPE_cart:write')")
  public Mono<Cart> updateProduct(
      @PathVariable String cartId,
      @PathVariable long sku,
      @RequestBody UpdateProductRequest request,
      @RequestHeader("x-store-number") int storeNumber,
      @RequestHeader("x-order-number") String orderNumber,
      @RequestHeader("x-userid") String userId,
      @RequestHeader("x-sessionid") String sessionId) {
    RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

    return validator
        .validateUpdateProduct(cartId, sku, request, storeNumber, orderNumber, userId, sessionId)
        .then(cartService.updateProduct(cartId, sku, request.quantity()))
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
  }

  /** Remove a product from the cart. */
  @DeleteMapping("/{sku}")
  @PreAuthorize("hasAuthority('SCOPE_cart:write')")
  public Mono<Cart> removeProduct(
      @PathVariable String cartId,
      @PathVariable long sku,
      @RequestHeader("x-store-number") int storeNumber,
      @RequestHeader("x-order-number") String orderNumber,
      @RequestHeader("x-userid") String userId,
      @RequestHeader("x-sessionid") String sessionId) {
    RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

    return validator
        .validateProductAccess(cartId, sku, storeNumber, orderNumber, userId, sessionId)
        .then(cartService.removeProduct(cartId, sku))
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
  }
}
