package org.example.model.discount;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Employee markdown applied to a cart or specific item.
 *
 * @param markdownId the unique markdown identifier
 * @param storeNumber the store where markdown is applied
 * @param sku the specific SKU or null for cart-level markdown
 * @param type the type of markdown
 * @param value the markdown value (percentage, fixed amount, or override price)
 * @param reason the reason for the markdown
 * @param employeeId the employee who applied the markdown
 * @param customerId the customer receiving the markdown
 * @param cartId the associated cart
 * @param appliedAt when the markdown was applied
 * @param expiresAt when the markdown expires (session-based)
 */
public record Markdown(
    String markdownId,
    int storeNumber,
    Long sku,
    MarkdownType type,
    BigDecimal value,
    MarkdownReason reason,
    String employeeId,
    String customerId,
    String cartId,
    Instant appliedAt,
    Instant expiresAt) {

  public boolean isExpired() {
    return expiresAt != null && expiresAt.isBefore(Instant.now());
  }

  public boolean isCartLevel() {
    return sku == null;
  }
}
