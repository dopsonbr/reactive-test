package org.example.fulfillment.dto;

import java.util.List;
import org.example.model.fulfillment.FulfillmentType;

public record FulfillmentCostRequest(FulfillmentType type, List<Long> skus) {}
