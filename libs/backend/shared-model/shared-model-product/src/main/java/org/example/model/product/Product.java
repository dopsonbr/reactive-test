package org.example.model.product;

import java.math.BigDecimal;

/**
 * Core product representation with all display fields.
 *
 * @param sku the stock keeping unit identifier
 * @param name short product name for display
 * @param description detailed product description
 * @param price current price
 * @param originalPrice original price before discount (nullable)
 * @param availableQuantity quantity available in inventory
 * @param imageUrl URL to product image
 * @param category product category for filtering/display
 * @param inStock true if product is available for purchase
 * @param onSale true if product has a discounted price
 */
public record Product(
    long sku,
    String name,
    String description,
    BigDecimal price,
    BigDecimal originalPrice,
    int availableQuantity,
    String imageUrl,
    String category,
    boolean inStock,
    boolean onSale) {

  /**
   * Creates a Product with computed inStock and onSale values based on quantity and pricing.
   *
   * @param sku the stock keeping unit identifier
   * @param name short product name for display
   * @param description detailed product description
   * @param price current price
   * @param originalPrice original price before discount (nullable)
   * @param availableQuantity quantity available in inventory
   * @param imageUrl URL to product image
   * @param category product category for filtering/display
   * @return a new Product with inStock and onSale computed
   */
  public static Product create(
      long sku,
      String name,
      String description,
      BigDecimal price,
      BigDecimal originalPrice,
      int availableQuantity,
      String imageUrl,
      String category) {
    boolean inStock = availableQuantity > 0;
    boolean onSale = originalPrice != null && originalPrice.compareTo(price) != 0;
    return new Product(
        sku,
        name,
        description,
        price,
        originalPrice,
        availableQuantity,
        imageUrl,
        category,
        inStock,
        onSale);
  }
}
