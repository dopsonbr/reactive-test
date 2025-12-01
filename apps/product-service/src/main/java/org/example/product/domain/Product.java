package org.example.product.domain;

public record Product(
    long sku,
    String description,
    String price,
    int availableQuantity
) {}
