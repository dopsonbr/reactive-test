package org.example.price.repository;

import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("prices")
public record PriceEntity(
    @Id Long sku,
    BigDecimal price,
    @Column("original_price") BigDecimal originalPrice,
    String currency,
    @Column("updated_at") Instant updatedAt) {}
