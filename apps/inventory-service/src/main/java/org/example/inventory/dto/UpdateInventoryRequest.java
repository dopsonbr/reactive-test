package org.example.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateInventoryRequest(
    @NotNull(message = "Available quantity is required")
        @Min(value = 0, message = "Quantity cannot be negative")
        Integer availableQuantity) {}
