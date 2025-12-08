package org.example.model.product;

import com.fasterxml.jackson.annotation.JsonProperty;
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
 */
public record Product(
    long sku,
    String name,
    String description,
    BigDecimal price,
    BigDecimal originalPrice,
    int availableQuantity,
    String imageUrl,
    String category) {
  /**
   * Check if product is in stock.
   *
   * @return true if availableQuantity > 0
   */
  @JsonProperty("inStock")
  public boolean inStock() {
    return availableQuantity > 0;
  }

  /**
   * Check if product is on sale (has different original price).
   *
   * @return true if originalPrice differs from price
   */
  @JsonProperty("onSale")
  public boolean onSale() {
    return originalPrice != null && originalPrice.compareTo(price) != 0;
  }
}
