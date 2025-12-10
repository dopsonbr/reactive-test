package org.example.price.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdatePriceRequest(
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price must be non-negative")
    BigDecimal price,

    BigDecimal originalPrice,

    String currency) {}
