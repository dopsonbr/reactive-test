package org.example.product.repository.merchandise;

/** Response from merchandise service. Includes all display metadata for a product. */
public record MerchandiseResponse(
    String name, String description, String imageUrl, String category) {}
