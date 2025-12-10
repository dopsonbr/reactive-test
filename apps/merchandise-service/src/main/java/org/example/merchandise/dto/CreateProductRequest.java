package org.example.merchandise.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CreateProductRequest(
    @NotNull(message = "SKU is required") @Positive(message = "SKU must be positive") Long sku,
    @NotBlank(message = "Name is required") String name,
    String description,
    String imageUrl,
    String category,
    @NotNull(message = "Suggested retail price is required")
        @DecimalMin(value = "0.01", message = "Price must be at least 0.01")
        BigDecimal suggestedRetailPrice,
    String currency) {}
