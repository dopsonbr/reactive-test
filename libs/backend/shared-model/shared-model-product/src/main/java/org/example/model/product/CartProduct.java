package org.example.model.product;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

/**
 * Product as it appears in a cart (with quantity and display fields).
 *
 * @param sku the stock keeping unit identifier
 * @param name short product name for display
 * @param description the product description
 * @param unitPrice the unit price
 * @param originalUnitPrice original price before discount (nullable)
 * @param quantity the quantity in the cart
 * @param availableQuantity the quantity available in inventory
 * @param imageUrl URL to product image
 * @param category product category
 */
public record CartProduct(
    long sku,
    String name,
    String description,
    BigDecimal unitPrice,
    BigDecimal originalUnitPrice,
    int quantity,
    int availableQuantity,
    String imageUrl,
    String category) {
  /**
   * Calculate the line total for this product.
   *
   * @return the line total (unitPrice * quantity)
   */
  @JsonProperty("lineTotal")
  public BigDecimal lineTotal() {
    return unitPrice.multiply(BigDecimal.valueOf(quantity));
  }

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
   * Create a CartProduct from a Product with a specified quantity.
   *
   * @param product the source product
   * @param quantity the quantity to add to cart
   * @return a new CartProduct
   */
  public static CartProduct fromProduct(Product product, int quantity) {
    return new CartProduct(
        product.sku(),
        product.name(),
        product.description(),
        product.price(),
        product.originalPrice(),
        quantity,
        product.availableQuantity(),
        product.imageUrl(),
        product.category());
  }

  /**
   * Create a new CartProduct with an updated quantity.
   *
   * @param newQuantity the new quantity
   * @return a new CartProduct with the updated quantity
   */
  public CartProduct withQuantity(int newQuantity) {
    return new CartProduct(
        sku,
        name,
        description,
        unitPrice,
        originalUnitPrice,
        newQuantity,
        availableQuantity,
        imageUrl,
        category);
  }
}
