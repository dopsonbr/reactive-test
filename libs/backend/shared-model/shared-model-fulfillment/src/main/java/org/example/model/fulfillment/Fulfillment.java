package org.example.model.fulfillment;

import java.math.BigDecimal;
import java.util.List;

/**
 * Minimal placeholder for fulfillment on a cart. This is a placeholder for a complex model with
 * B2B/B2C omnichannel fulfillment options (delivery, pickup, installation, haul-away, scheduling,
 * etc.). Will be expanded in a future feature plan.
 *
 * @param fulfillmentId the unique fulfillment identifier
 * @param type the type of fulfillment
 * @param skus the SKUs covered by this fulfillment option
 * @param cost the cost of this fulfillment option
 */
public record Fulfillment(
    String fulfillmentId, FulfillmentType type, List<Long> skus, BigDecimal cost) {}
