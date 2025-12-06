package org.example.discount.controller.dto;

import java.math.BigDecimal;
import org.example.model.discount.MarkdownReason;
import org.example.model.discount.MarkdownType;

/**
 * Request to apply an employee markdown.
 *
 * @param storeNumber the store number
 * @param sku the SKU to markdown (null for cart-level)
 * @param type the markdown type
 * @param value the markdown value
 * @param reason the reason for markdown
 * @param customerId the customer ID
 * @param cartId the cart ID
 */
public record ApplyMarkdownRequest(
    int storeNumber,
    Long sku,
    MarkdownType type,
    BigDecimal value,
    MarkdownReason reason,
    String customerId,
    String cartId) {}
