package org.example.product.domain;

import java.math.BigDecimal;

public record SearchProduct(
        long sku,
        String description,
        BigDecimal price,
        int availableQuantity,
        String category,
        double relevanceScore) {
    public boolean isInStock() {
        return availableQuantity > 0;
    }
}
