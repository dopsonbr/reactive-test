package org.example.cart.service;

import org.example.cart.domain.Cart;
import org.example.cart.domain.CartItem;
import org.example.platform.logging.StructuredLogger;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory cart service for demonstration.
 * In production, this would use Redis or a database.
 */
@Service
public class CartService {
    private static final String LOGGER_NAME = "cartservice";

    private final Map<String, Cart> carts = new ConcurrentHashMap<>();
    private final StructuredLogger structuredLogger;

    public CartService(StructuredLogger structuredLogger) {
        this.structuredLogger = structuredLogger;
    }

    /**
     * Create a new cart for a user.
     */
    public Mono<Cart> createCart(String userId) {
        return Mono.deferContextual(ctx -> {
            String cartId = UUID.randomUUID().toString();
            Instant now = Instant.now();
            Cart cart = new Cart(cartId, userId, new ArrayList<>(), now, now);
            carts.put(cartId, cart);
            structuredLogger.logMessage(ctx, LOGGER_NAME, "Created cart: " + cartId + " for user: " + userId);
            return Mono.just(cart);
        });
    }

    /**
     * Get a cart by ID.
     */
    public Mono<Cart> getCart(String cartId) {
        return Mono.deferContextual(ctx -> {
            Cart cart = carts.get(cartId);
            if (cart == null) {
                structuredLogger.logMessage(ctx, LOGGER_NAME, "Cart not found: " + cartId);
                return Mono.empty();
            }
            return Mono.just(cart);
        });
    }

    /**
     * Add or update an item in the cart.
     */
    public Mono<Cart> addItem(String cartId, String sku, int quantity, BigDecimal price) {
        return Mono.deferContextual(ctx -> {
            Cart cart = carts.get(cartId);
            if (cart == null) {
                return Mono.empty();
            }

            List<CartItem> items = new ArrayList<>(cart.items());

            // Remove existing item with same SKU
            items.removeIf(item -> item.sku().equals(sku));

            // Add new item
            items.add(new CartItem(sku, quantity, price));

            Cart updatedCart = new Cart(cart.id(), cart.userId(), items, cart.createdAt(), Instant.now());
            carts.put(cartId, updatedCart);

            structuredLogger.logMessage(ctx, LOGGER_NAME,
                "Added item to cart: " + cartId + ", sku: " + sku + ", qty: " + quantity);

            return Mono.just(updatedCart);
        });
    }

    /**
     * Remove an item from the cart.
     */
    public Mono<Cart> removeItem(String cartId, String sku) {
        return Mono.deferContextual(ctx -> {
            Cart cart = carts.get(cartId);
            if (cart == null) {
                return Mono.empty();
            }

            List<CartItem> items = new ArrayList<>(cart.items());
            boolean removed = items.removeIf(item -> item.sku().equals(sku));

            if (!removed) {
                return Mono.just(cart);
            }

            Cart updatedCart = new Cart(cart.id(), cart.userId(), items, cart.createdAt(), Instant.now());
            carts.put(cartId, updatedCart);

            structuredLogger.logMessage(ctx, LOGGER_NAME,
                "Removed item from cart: " + cartId + ", sku: " + sku);

            return Mono.just(updatedCart);
        });
    }

    /**
     * Delete a cart.
     */
    public Mono<Void> deleteCart(String cartId) {
        return Mono.deferContextual(ctx -> {
            carts.remove(cartId);
            structuredLogger.logMessage(ctx, LOGGER_NAME, "Deleted cart: " + cartId);
            return Mono.empty();
        });
    }
}
