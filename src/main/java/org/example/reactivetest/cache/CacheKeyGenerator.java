package org.example.reactivetest.cache;

/**
 * Generates consistent cache keys for different services.
 */
public final class CacheKeyGenerator {

    private static final String MERCHANDISE_PREFIX = "merchandise:sku:";
    private static final String PRICE_PREFIX = "price:sku:";
    private static final String INVENTORY_PREFIX = "inventory:sku:";

    private CacheKeyGenerator() {
        // Utility class
    }

    public static String merchandiseKey(long sku) {
        return MERCHANDISE_PREFIX + sku;
    }

    public static String priceKey(long sku) {
        return PRICE_PREFIX + sku;
    }

    public static String inventoryKey(long sku) {
        return INVENTORY_PREFIX + sku;
    }
}
