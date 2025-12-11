package org.example.discount.controller.dto;

import java.math.BigDecimal;
import org.example.model.discount.MarkdownReason;
import org.example.model.discount.MarkdownType;

/**
 * Request to apply a markdown that requires manager override.
 *
 * @param cartId the cart ID to apply markdown to
 * @param sku the SKU to markdown (null for cart-level)
 * @param lineId the line item ID (null for cart-level)
 * @param type the markdown type
 * @param value the markdown value (percentage as decimal, or dollar amount)
 * @param reason the reason for the markdown
 * @param notes optional notes
 * @param requestingUserId the user requesting the markdown
 * @param managerId the manager ID authorizing the override
 * @param managerPin the manager's PIN for authentication
 */
public record MarkdownOverrideRequest(
    String cartId,
    String sku,
    String lineId,
    MarkdownType type,
    BigDecimal value,
    MarkdownReason reason,
    String notes,
    String requestingUserId,
    String managerId,
    String managerPin) {}
