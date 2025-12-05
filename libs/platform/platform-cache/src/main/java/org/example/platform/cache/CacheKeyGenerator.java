package org.example.platform.cache;

/**
 * Generates consistent cache keys for different services. Each service should have its own prefix
 * to avoid key collisions.
 */
public final class CacheKeyGenerator {

  private static final String MERCHANDISE_PREFIX = "merchandise:sku:";
  private static final String PRICE_PREFIX = "price:sku:";
  private static final String INVENTORY_PREFIX = "inventory:sku:";

  private CacheKeyGenerator() {
    // Utility class
  }

  /**
   * Generate a cache key for merchandise data.
   *
   * @param sku the SKU identifier
   * @return the cache key
   */
  public static String merchandiseKey(long sku) {
    return MERCHANDISE_PREFIX + sku;
  }

  /**
   * Generate a cache key for price data.
   *
   * @param sku the SKU identifier
   * @return the cache key
   */
  public static String priceKey(long sku) {
    return PRICE_PREFIX + sku;
  }

  /**
   * Generate a cache key for inventory data.
   *
   * @param sku the SKU identifier
   * @return the cache key
   */
  public static String inventoryKey(long sku) {
    return INVENTORY_PREFIX + sku;
  }

  /**
   * Generate a cache key with a custom prefix.
   *
   * @param prefix the key prefix
   * @param identifier the unique identifier
   * @return the cache key
   */
  public static String customKey(String prefix, String identifier) {
    return prefix + ":" + identifier;
  }
}
