package org.example.merchandise.dto;

import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;

public record UpdateProductRequest(
    String name,
    String description,
    String imageUrl,
    String category,
    @DecimalMin(value = "0.01", message = "Price must be at least 0.01")
        BigDecimal suggestedRetailPrice,
    String currency) {}
