package org.example.model.product;

import java.math.BigDecimal;

/**
 * Product as it appears in a cart (with quantity).
 *
 * @param sku the stock keeping unit identifier
 * @param description the product description
 * @param unitPrice the unit price as a string
 * @param quantity the quantity in the cart
 * @param availableQuantity the quantity available in inventory
 */
public record CartProduct(
    long sku, String description, String unitPrice, int quantity, int availableQuantity) {
  /**
   * Calculate the line total for this product.
   *
   * @return the line total (unitPrice * quantity)
   */
  public BigDecimal lineTotal() {
    return new BigDecimal(unitPrice).multiply(BigDecimal.valueOf(quantity));
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
        product.description(),
        product.price(),
        quantity,
        product.availableQuantity());
  }

  /**
   * Create a new CartProduct with an updated quantity.
   *
   * @param newQuantity the new quantity
   * @return a new CartProduct with the updated quantity
   */
  public CartProduct withQuantity(int newQuantity) {
    return new CartProduct(sku, description, unitPrice, newQuantity, availableQuantity);
  }
}
