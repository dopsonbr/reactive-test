package org.example.fulfillment.dto;

import java.util.List;
import org.example.model.fulfillment.FulfillmentType;

public record FulfillmentPlanRequest(
    String cartId, FulfillmentType type, List<Long> skus, String destinationZipCode) {}
