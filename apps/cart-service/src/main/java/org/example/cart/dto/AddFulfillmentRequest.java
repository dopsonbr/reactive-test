package org.example.cart.dto;

import java.util.List;
import org.example.model.fulfillment.FulfillmentType;

/**
 * Request to add fulfillment to the cart.
 *
 * @param type the fulfillment type
 * @param skus the SKUs covered by this fulfillment
 */
public record AddFulfillmentRequest(FulfillmentType type, List<Long> skus) {}
