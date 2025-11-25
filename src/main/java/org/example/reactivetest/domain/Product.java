package org.example.reactivetest.domain;

public record Product(
    long sku,
    String description,
    String price,
    int availableQuantity
) {}
