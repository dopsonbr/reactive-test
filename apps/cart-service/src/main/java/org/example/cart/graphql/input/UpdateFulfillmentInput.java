package org.example.cart.graphql.input;

import java.util.List;
import org.example.model.fulfillment.FulfillmentType;

public record UpdateFulfillmentInput(FulfillmentType type, List<String> skus) {}
