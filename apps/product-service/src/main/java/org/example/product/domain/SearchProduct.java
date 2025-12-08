package org.example.product.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

/**
 * Product representation for search results.
 *
 * @param sku the stock keeping unit identifier
 * @param name short product name for display
 * @param description detailed product description
 * @param price current price
 * @param originalPrice original price before discount (nullable)
 * @param availableQuantity quantity available in inventory
 * @param imageUrl URL to product image
 * @param category product category for filtering/display
 * @param relevanceScore search relevance score
 */
public record SearchProduct(
    long sku,
    String name,
    String description,
    BigDecimal price,
    BigDecimal originalPrice,
    int availableQuantity,
    String imageUrl,
    String category,
    double relevanceScore) {

  @JsonProperty("inStock")
  public boolean isInStock() {
    return availableQuantity > 0;
  }

  @JsonProperty("onSale")
  public boolean onSale() {
    return originalPrice != null && originalPrice.compareTo(price) != 0;
  }
}
