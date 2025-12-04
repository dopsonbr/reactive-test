package org.example.cart.dto;

import java.util.List;
import org.example.model.fulfillment.FulfillmentType;

/**
 * Request to update a fulfillment in the cart.
 *
 * @param type the fulfillment type
 * @param skus the SKUs covered by this fulfillment
 */
public record UpdateFulfillmentRequest(FulfillmentType type, List<Long> skus) {}
