package org.example.cart.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.example.cart.audit.AuditEvent;
import org.example.cart.audit.AuditEventPublisher;
import org.example.cart.client.CustomerServiceClient;
import org.example.cart.client.DiscountServiceClient;
import org.example.cart.client.FulfillmentServiceClient;
import org.example.cart.client.ProductServiceClient;
import org.example.cart.model.Cart;
import org.example.cart.repository.CartRepository;
import org.example.model.customer.CartCustomer;
import org.example.model.discount.AppliedDiscount;
import org.example.model.fulfillment.Fulfillment;
import org.example.model.fulfillment.FulfillmentType;
import org.example.model.product.CartProduct;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Service for managing shopping carts with full CRUD operations. */
@Service
public class CartService {

    private static final String LOGGER_NAME = "cartservice";

    private final CartRepository cartRepository;
    private final ProductServiceClient productServiceClient;
    private final CustomerServiceClient customerServiceClient;
    private final DiscountServiceClient discountServiceClient;
    private final FulfillmentServiceClient fulfillmentServiceClient;
    private final AuditEventPublisher auditEventPublisher;
    private final StructuredLogger structuredLogger;

    public CartService(
            CartRepository cartRepository,
            ProductServiceClient productServiceClient,
            CustomerServiceClient customerServiceClient,
            DiscountServiceClient discountServiceClient,
            FulfillmentServiceClient fulfillmentServiceClient,
            AuditEventPublisher auditEventPublisher,
            StructuredLogger structuredLogger) {
        this.cartRepository = cartRepository;
        this.productServiceClient = productServiceClient;
        this.customerServiceClient = customerServiceClient;
        this.discountServiceClient = discountServiceClient;
        this.fulfillmentServiceClient = fulfillmentServiceClient;
        this.auditEventPublisher = auditEventPublisher;
        this.structuredLogger = structuredLogger;
    }

    // ==================== Cart Lifecycle ====================

    /** Create a new cart. */
    public Mono<Cart> createCart(int storeNumber, String customerId) {
        return Mono.deferContextual(
                ctx -> {
                    String cartId = UUID.randomUUID().toString();
                    Cart cart = Cart.create(cartId, storeNumber, customerId);

                    structuredLogger.logMessage(
                            ctx,
                            LOGGER_NAME,
                            String.format("Creating cart: %s for store: %d", cartId, storeNumber));

                    return cartRepository
                            .save(cart)
                            .flatMap(
                                    savedCart ->
                                            publishAuditEvent(
                                                            ctx,
                                                            "CART_CREATED",
                                                            savedCart,
                                                            Map.of(
                                                                    "storeNumber",
                                                                    storeNumber,
                                                                    "customerId",
                                                                    customerId != null
                                                                            ? customerId
                                                                            : "anonymous"))
                                                    .thenReturn(savedCart));
                });
    }

    /** Get a cart by ID. */
    public Mono<Cart> getCart(String cartId) {
        return Mono.deferContextual(
                ctx ->
                        cartRepository
                                .findById(cartId)
                                .switchIfEmpty(
                                        Mono.defer(
                                                () -> {
                                                    structuredLogger.logMessage(
                                                            ctx,
                                                            LOGGER_NAME,
                                                            "Cart not found: " + cartId);
                                                    return Mono.error(
                                                            new ResponseStatusException(
                                                                    HttpStatus.NOT_FOUND,
                                                                    "Cart not found"));
                                                }))
                                .flatMap(
                                        cart ->
                                                publishAuditEvent(
                                                                ctx, "CART_VIEWED", cart, Map.of())
                                                        .thenReturn(cart)));
    }

    /** Find all carts for a store. */
    public Flux<Cart> findByStoreNumber(int storeNumber) {
        return cartRepository.findByStoreNumber(storeNumber);
    }

    /** Find all carts for a customer. */
    public Flux<Cart> findByCustomerId(String customerId) {
        return cartRepository.findByCustomerId(customerId);
    }

    /** Delete a cart. */
    public Mono<Void> deleteCart(String cartId) {
        return Mono.deferContextual(
                ctx ->
                        cartRepository
                                .findById(cartId)
                                .flatMap(
                                        cart -> {
                                            structuredLogger.logMessage(
                                                    ctx, LOGGER_NAME, "Deleting cart: " + cartId);
                                            return publishAuditEvent(
                                                            ctx, "CART_DELETED", cart, Map.of())
                                                    .then(cartRepository.deleteById(cartId));
                                        }));
    }

    // ==================== Product Operations ====================

    /** Add a product to the cart. */
    public Mono<Cart> addProduct(String cartId, long sku, int quantity) {
        return Mono.deferContextual(
                ctx -> {
                    RequestMetadata metadata = ctx.getOrDefault(ContextKeys.METADATA, null);
                    int storeNumber = metadata != null ? metadata.storeNumber() : 0;
                    String orderNumber = metadata != null ? metadata.orderNumber() : "";
                    String userId = metadata != null ? metadata.userId() : "";
                    String sessionId = metadata != null ? metadata.sessionId() : "";

                    return getCartOrError(cartId)
                            .flatMap(
                                    cart ->
                                            productServiceClient
                                                    .getProduct(
                                                            sku,
                                                            storeNumber,
                                                            orderNumber,
                                                            userId,
                                                            sessionId)
                                                    .flatMap(
                                                            product -> {
                                                                CartProduct cartProduct =
                                                                        CartProduct.fromProduct(
                                                                                product, quantity);
                                                                List<CartProduct> products =
                                                                        new ArrayList<>(
                                                                                cart.products());

                                                                // Remove existing product with same
                                                                // SKU if present
                                                                products.removeIf(
                                                                        p -> p.sku() == sku);
                                                                products.add(cartProduct);

                                                                Cart updatedCart =
                                                                        cart.withProducts(products);
                                                                structuredLogger.logMessage(
                                                                        ctx,
                                                                        LOGGER_NAME,
                                                                        String.format(
                                                                                "Adding product %d"
                                                                                    + " qty %d to"
                                                                                    + " cart %s",
                                                                                sku, quantity,
                                                                                cartId));

                                                                return cartRepository
                                                                        .save(updatedCart)
                                                                        .flatMap(
                                                                                savedCart ->
                                                                                        publishAuditEvent(
                                                                                                        ctx,
                                                                                                        "PRODUCT_ADDED",
                                                                                                        savedCart,
                                                                                                        Map
                                                                                                                .of(
                                                                                                                        "sku",
                                                                                                                        sku,
                                                                                                                        "quantity",
                                                                                                                        quantity,
                                                                                                                        "unitPrice",
                                                                                                                        product
                                                                                                                                .price()))
                                                                                                .thenReturn(
                                                                                                        savedCart));
                                                            }));
                });
    }

    /** Update a product quantity in the cart. */
    public Mono<Cart> updateProduct(String cartId, long sku, int quantity) {
        return Mono.deferContextual(
                ctx ->
                        getCartOrError(cartId)
                                .flatMap(
                                        cart -> {
                                            Optional<CartProduct> existingProduct =
                                                    cart.products().stream()
                                                            .filter(p -> p.sku() == sku)
                                                            .findFirst();

                                            if (existingProduct.isEmpty()) {
                                                return Mono.error(
                                                        new ResponseStatusException(
                                                                HttpStatus.NOT_FOUND,
                                                                "Product not found in cart"));
                                            }

                                            int oldQuantity = existingProduct.get().quantity();
                                            List<CartProduct> products =
                                                    new ArrayList<>(cart.products());
                                            products.removeIf(p -> p.sku() == sku);
                                            products.add(
                                                    existingProduct.get().withQuantity(quantity));

                                            Cart updatedCart = cart.withProducts(products);
                                            structuredLogger.logMessage(
                                                    ctx,
                                                    LOGGER_NAME,
                                                    String.format(
                                                            "Updating product %d from qty %d to %d"
                                                                    + " in cart %s",
                                                            sku, oldQuantity, quantity, cartId));

                                            return cartRepository
                                                    .save(updatedCart)
                                                    .flatMap(
                                                            savedCart ->
                                                                    publishAuditEvent(
                                                                                    ctx,
                                                                                    "PRODUCT_UPDATED",
                                                                                    savedCart,
                                                                                    Map.of(
                                                                                            "sku",
                                                                                            sku,
                                                                                            "oldQuantity",
                                                                                            oldQuantity,
                                                                                            "newQuantity",
                                                                                            quantity))
                                                                            .thenReturn(savedCart));
                                        }));
    }

    /** Remove a product from the cart. */
    public Mono<Cart> removeProduct(String cartId, long sku) {
        return Mono.deferContextual(
                ctx ->
                        getCartOrError(cartId)
                                .flatMap(
                                        cart -> {
                                            List<CartProduct> products =
                                                    new ArrayList<>(cart.products());
                                            boolean removed =
                                                    products.removeIf(p -> p.sku() == sku);

                                            if (!removed) {
                                                return Mono.error(
                                                        new ResponseStatusException(
                                                                HttpStatus.NOT_FOUND,
                                                                "Product not found in cart"));
                                            }

                                            Cart updatedCart = cart.withProducts(products);
                                            structuredLogger.logMessage(
                                                    ctx,
                                                    LOGGER_NAME,
                                                    String.format(
                                                            "Removing product %d from cart %s",
                                                            sku, cartId));

                                            return cartRepository
                                                    .save(updatedCart)
                                                    .flatMap(
                                                            savedCart ->
                                                                    publishAuditEvent(
                                                                                    ctx,
                                                                                    "PRODUCT_REMOVED",
                                                                                    savedCart,
                                                                                    Map.of(
                                                                                            "sku",
                                                                                            sku))
                                                                            .thenReturn(savedCart));
                                        }));
    }

    /** Get a specific product from the cart. */
    public Mono<CartProduct> getProduct(String cartId, long sku) {
        return getCartOrError(cartId)
                .flatMap(
                        cart ->
                                cart.products().stream()
                                        .filter(p -> p.sku() == sku)
                                        .findFirst()
                                        .map(Mono::just)
                                        .orElse(
                                                Mono.error(
                                                        new ResponseStatusException(
                                                                HttpStatus.NOT_FOUND,
                                                                "Product not found in cart"))));
    }

    /** Get all products in the cart. */
    public Mono<List<CartProduct>> getProducts(String cartId) {
        return getCartOrError(cartId).map(Cart::products);
    }

    // ==================== Customer Operations ====================

    /** Set or update customer on the cart. */
    public Mono<Cart> setCustomer(String cartId, String customerId, String name, String email) {
        return Mono.deferContextual(
                ctx ->
                        getCartOrError(cartId)
                                .flatMap(
                                        cart -> {
                                            // Validate customer exists (optional - returns true if
                                            // valid, false if not found)
                                            return customerServiceClient
                                                    .validateCustomer(customerId)
                                                    .flatMap(
                                                            valid -> {
                                                                if (!valid) {
                                                                    return Mono.error(
                                                                            new ResponseStatusException(
                                                                                    HttpStatus
                                                                                            .BAD_REQUEST,
                                                                                    "Customer not"
                                                                                        + " found: "
                                                                                            + customerId));
                                                                }

                                                                CartCustomer customer =
                                                                        new CartCustomer(
                                                                                customerId,
                                                                                name,
                                                                                email);
                                                                Cart updatedCart =
                                                                        cart.withCustomer(customer);
                                                                structuredLogger.logMessage(
                                                                        ctx,
                                                                        LOGGER_NAME,
                                                                        String.format(
                                                                                "Setting customer"
                                                                                    + " %s on cart"
                                                                                    + " %s",
                                                                                customerId,
                                                                                cartId));

                                                                return cartRepository
                                                                        .save(updatedCart)
                                                                        .flatMap(
                                                                                savedCart ->
                                                                                        publishAuditEvent(
                                                                                                        ctx,
                                                                                                        "CUSTOMER_SET",
                                                                                                        savedCart,
                                                                                                        Map
                                                                                                                .of(
                                                                                                                        "customerId",
                                                                                                                        customerId))
                                                                                                .thenReturn(
                                                                                                        savedCart));
                                                            });
                                        }));
    }

    /** Get customer from the cart. */
    public Mono<CartCustomer> getCustomer(String cartId) {
        return getCartOrError(cartId)
                .flatMap(
                        cart -> {
                            if (cart.customer() == null) {
                                return Mono.error(
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "No customer set on cart"));
                            }
                            return Mono.just(cart.customer());
                        });
    }

    /** Remove customer from the cart. */
    public Mono<Cart> removeCustomer(String cartId) {
        return Mono.deferContextual(
                ctx ->
                        getCartOrError(cartId)
                                .flatMap(
                                        cart -> {
                                            String oldCustomerId = cart.customerId();
                                            Cart updatedCart = cart.withCustomer(null);
                                            structuredLogger.logMessage(
                                                    ctx,
                                                    LOGGER_NAME,
                                                    String.format(
                                                            "Removing customer from cart %s",
                                                            cartId));

                                            return cartRepository
                                                    .save(updatedCart)
                                                    .flatMap(
                                                            savedCart ->
                                                                    publishAuditEvent(
                                                                                    ctx,
                                                                                    "CUSTOMER_REMOVED",
                                                                                    savedCart,
                                                                                    Map.of(
                                                                                            "customerId",
                                                                                            oldCustomerId
                                                                                                            != null
                                                                                                    ? oldCustomerId
                                                                                                    : ""))
                                                                            .thenReturn(savedCart));
                                        }));
    }

    // ==================== Discount Operations ====================

    /** Apply a discount to the cart. */
    public Mono<Cart> applyDiscount(String cartId, String code) {
        return Mono.deferContextual(
                ctx ->
                        getCartOrError(cartId)
                                .flatMap(
                                        cart -> {
                                            BigDecimal subtotal = cart.totals().subtotal();
                                            List<Long> skus =
                                                    cart.products().stream()
                                                            .map(CartProduct::sku)
                                                            .toList();

                                            return discountServiceClient
                                                    .calculateDiscount(code, subtotal, skus)
                                                    .flatMap(
                                                            appliedDiscount -> {
                                                                List<AppliedDiscount> discounts =
                                                                        new ArrayList<>(
                                                                                cart.discounts());
                                                                // Remove existing discount with
                                                                // same ID if present
                                                                discounts.removeIf(
                                                                        d ->
                                                                                d.discountId()
                                                                                        .equals(
                                                                                                appliedDiscount
                                                                                                        .discountId()));
                                                                discounts.add(appliedDiscount);

                                                                Cart updatedCart =
                                                                        cart.withDiscounts(
                                                                                discounts);
                                                                structuredLogger.logMessage(
                                                                        ctx,
                                                                        LOGGER_NAME,
                                                                        String.format(
                                                                                "Applying discount"
                                                                                    + " %s to cart"
                                                                                    + " %s",
                                                                                code, cartId));

                                                                return cartRepository
                                                                        .save(updatedCart)
                                                                        .flatMap(
                                                                                savedCart ->
                                                                                        publishAuditEvent(
                                                                                                        ctx,
                                                                                                        "DISCOUNT_APPLIED",
                                                                                                        savedCart,
                                                                                                        Map
                                                                                                                .of(
                                                                                                                        "discountCode",
                                                                                                                        code,
                                                                                                                        "savings",
                                                                                                                        appliedDiscount
                                                                                                                                .appliedSavings()))
                                                                                                .thenReturn(
                                                                                                        savedCart));
                                                            });
                                        }));
    }

    /** Get all discounts on the cart. */
    public Mono<List<AppliedDiscount>> getDiscounts(String cartId) {
        return getCartOrError(cartId).map(Cart::discounts);
    }

    /** Get a specific discount from the cart. */
    public Mono<AppliedDiscount> getDiscount(String cartId, String discountId) {
        return getCartOrError(cartId)
                .flatMap(
                        cart ->
                                cart.discounts().stream()
                                        .filter(d -> d.discountId().equals(discountId))
                                        .findFirst()
                                        .map(Mono::just)
                                        .orElse(
                                                Mono.error(
                                                        new ResponseStatusException(
                                                                HttpStatus.NOT_FOUND,
                                                                "Discount not found in cart"))));
    }

    /** Remove a discount from the cart. */
    public Mono<Cart> removeDiscount(String cartId, String discountId) {
        return Mono.deferContextual(
                ctx ->
                        getCartOrError(cartId)
                                .flatMap(
                                        cart -> {
                                            List<AppliedDiscount> discounts =
                                                    new ArrayList<>(cart.discounts());
                                            boolean removed =
                                                    discounts.removeIf(
                                                            d -> d.discountId().equals(discountId));

                                            if (!removed) {
                                                return Mono.error(
                                                        new ResponseStatusException(
                                                                HttpStatus.NOT_FOUND,
                                                                "Discount not found in cart"));
                                            }

                                            Cart updatedCart = cart.withDiscounts(discounts);
                                            structuredLogger.logMessage(
                                                    ctx,
                                                    LOGGER_NAME,
                                                    String.format(
                                                            "Removing discount %s from cart %s",
                                                            discountId, cartId));

                                            return cartRepository
                                                    .save(updatedCart)
                                                    .flatMap(
                                                            savedCart ->
                                                                    publishAuditEvent(
                                                                                    ctx,
                                                                                    "DISCOUNT_REMOVED",
                                                                                    savedCart,
                                                                                    Map.of(
                                                                                            "discountId",
                                                                                            discountId))
                                                                            .thenReturn(savedCart));
                                        }));
    }

    // ==================== Fulfillment Operations ====================

    /** Add a fulfillment option to the cart. */
    public Mono<Cart> addFulfillment(String cartId, FulfillmentType type, List<Long> skus) {
        return Mono.deferContextual(
                ctx ->
                        getCartOrError(cartId)
                                .flatMap(
                                        cart ->
                                                fulfillmentServiceClient
                                                        .calculateFulfillmentCost(type, skus)
                                                        .flatMap(
                                                                cost -> {
                                                                    String fulfillmentId =
                                                                            UUID.randomUUID()
                                                                                    .toString();
                                                                    Fulfillment fulfillment =
                                                                            new Fulfillment(
                                                                                    fulfillmentId,
                                                                                    type,
                                                                                    skus,
                                                                                    cost);

                                                                    List<Fulfillment> fulfillments =
                                                                            new ArrayList<>(
                                                                                    cart
                                                                                            .fulfillments());
                                                                    fulfillments.add(fulfillment);

                                                                    Cart updatedCart =
                                                                            cart.withFulfillments(
                                                                                    fulfillments);
                                                                    structuredLogger.logMessage(
                                                                            ctx,
                                                                            LOGGER_NAME,
                                                                            String.format(
                                                                                    "Adding %s"
                                                                                        + " fulfillment"
                                                                                        + " to cart"
                                                                                        + " %s",
                                                                                    type, cartId));

                                                                    return cartRepository
                                                                            .save(updatedCart)
                                                                            .flatMap(
                                                                                    savedCart ->
                                                                                            publishAuditEvent(
                                                                                                            ctx,
                                                                                                            "FULFILLMENT_ADDED",
                                                                                                            savedCart,
                                                                                                            Map
                                                                                                                    .of(
                                                                                                                            "fulfillmentType",
                                                                                                                            type
                                                                                                                                    .name(),
                                                                                                                            "cost",
                                                                                                                            cost))
                                                                                                    .thenReturn(
                                                                                                            savedCart));
                                                                })));
    }

    /** Get all fulfillments on the cart. */
    public Mono<List<Fulfillment>> getFulfillments(String cartId) {
        return getCartOrError(cartId).map(Cart::fulfillments);
    }

    /** Get a specific fulfillment from the cart. */
    public Mono<Fulfillment> getFulfillment(String cartId, String fulfillmentId) {
        return getCartOrError(cartId)
                .flatMap(
                        cart ->
                                cart.fulfillments().stream()
                                        .filter(f -> f.fulfillmentId().equals(fulfillmentId))
                                        .findFirst()
                                        .map(Mono::just)
                                        .orElse(
                                                Mono.error(
                                                        new ResponseStatusException(
                                                                HttpStatus.NOT_FOUND,
                                                                "Fulfillment not found in cart"))));
    }

    /** Update a fulfillment in the cart. */
    public Mono<Cart> updateFulfillment(
            String cartId, String fulfillmentId, FulfillmentType type, List<Long> skus) {
        return Mono.deferContextual(
                ctx ->
                        getCartOrError(cartId)
                                .flatMap(
                                        cart -> {
                                            boolean exists =
                                                    cart.fulfillments().stream()
                                                            .anyMatch(
                                                                    f ->
                                                                            f.fulfillmentId()
                                                                                    .equals(
                                                                                            fulfillmentId));

                                            if (!exists) {
                                                return Mono.error(
                                                        new ResponseStatusException(
                                                                HttpStatus.NOT_FOUND,
                                                                "Fulfillment not found in cart"));
                                            }

                                            return fulfillmentServiceClient
                                                    .calculateFulfillmentCost(type, skus)
                                                    .flatMap(
                                                            cost -> {
                                                                Fulfillment updatedFulfillment =
                                                                        new Fulfillment(
                                                                                fulfillmentId,
                                                                                type,
                                                                                skus,
                                                                                cost);

                                                                List<Fulfillment> fulfillments =
                                                                        new ArrayList<>(
                                                                                cart
                                                                                        .fulfillments());
                                                                fulfillments.removeIf(
                                                                        f ->
                                                                                f.fulfillmentId()
                                                                                        .equals(
                                                                                                fulfillmentId));
                                                                fulfillments.add(
                                                                        updatedFulfillment);

                                                                Cart updatedCart =
                                                                        cart.withFulfillments(
                                                                                fulfillments);
                                                                structuredLogger.logMessage(
                                                                        ctx,
                                                                        LOGGER_NAME,
                                                                        String.format(
                                                                                "Updating"
                                                                                    + " fulfillment"
                                                                                    + " %s in cart"
                                                                                    + " %s",
                                                                                fulfillmentId,
                                                                                cartId));

                                                                return cartRepository
                                                                        .save(updatedCart)
                                                                        .flatMap(
                                                                                savedCart ->
                                                                                        publishAuditEvent(
                                                                                                        ctx,
                                                                                                        "FULFILLMENT_UPDATED",
                                                                                                        savedCart,
                                                                                                        Map
                                                                                                                .of(
                                                                                                                        "fulfillmentId",
                                                                                                                        fulfillmentId))
                                                                                                .thenReturn(
                                                                                                        savedCart));
                                                            });
                                        }));
    }

    /** Remove a fulfillment from the cart. */
    public Mono<Cart> removeFulfillment(String cartId, String fulfillmentId) {
        return Mono.deferContextual(
                ctx ->
                        getCartOrError(cartId)
                                .flatMap(
                                        cart -> {
                                            List<Fulfillment> fulfillments =
                                                    new ArrayList<>(cart.fulfillments());
                                            boolean removed =
                                                    fulfillments.removeIf(
                                                            f ->
                                                                    f.fulfillmentId()
                                                                            .equals(fulfillmentId));

                                            if (!removed) {
                                                return Mono.error(
                                                        new ResponseStatusException(
                                                                HttpStatus.NOT_FOUND,
                                                                "Fulfillment not found in cart"));
                                            }

                                            Cart updatedCart = cart.withFulfillments(fulfillments);
                                            structuredLogger.logMessage(
                                                    ctx,
                                                    LOGGER_NAME,
                                                    String.format(
                                                            "Removing fulfillment %s from cart %s",
                                                            fulfillmentId, cartId));

                                            return cartRepository
                                                    .save(updatedCart)
                                                    .flatMap(
                                                            savedCart ->
                                                                    publishAuditEvent(
                                                                                    ctx,
                                                                                    "FULFILLMENT_REMOVED",
                                                                                    savedCart,
                                                                                    Map.of(
                                                                                            "fulfillmentId",
                                                                                            fulfillmentId))
                                                                            .thenReturn(savedCart));
                                        }));
    }

    // ==================== Helper Methods ====================

    private Mono<Cart> getCartOrError(String cartId) {
        return cartRepository
                .findById(cartId)
                .switchIfEmpty(
                        Mono.error(
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Cart not found")));
    }

    private Mono<Void> publishAuditEvent(
            reactor.util.context.ContextView ctx,
            String eventType,
            Cart cart,
            Map<String, Object> data) {
        RequestMetadata metadata = ctx.getOrDefault(ContextKeys.METADATA, null);
        String userId = metadata != null ? metadata.userId() : "";
        String sessionId = metadata != null ? metadata.sessionId() : "";

        AuditEvent event =
                AuditEvent.cartEvent(
                        eventType, cart.id(), cart.storeNumber(), userId, sessionId, data);

        return auditEventPublisher.publish(event);
    }
}
