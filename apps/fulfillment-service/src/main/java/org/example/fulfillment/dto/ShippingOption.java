package org.example.fulfillment.dto;

import java.math.BigDecimal;

public record ShippingOption(
    String optionId,
    String name,
    String description,
    BigDecimal cost,
    int estimatedDaysMin,
    int estimatedDaysMax) {}
