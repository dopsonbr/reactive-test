package org.example.merchandise.repository;

import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("products")
public record ProductEntity(
    @Id Long sku,
    String name,
    String description,
    @Column("image_url") String imageUrl,
    String category,
    @Column("suggested_retail_price") BigDecimal suggestedRetailPrice,
    String currency,
    @Column("created_at") Instant createdAt,
    @Column("updated_at") Instant updatedAt) {}
