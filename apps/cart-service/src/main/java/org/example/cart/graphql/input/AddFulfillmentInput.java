package org.example.cart.graphql.input;

import java.util.List;
import org.example.model.fulfillment.FulfillmentType;

public record AddFulfillmentInput(FulfillmentType type, List<String> skus) {}
