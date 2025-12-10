package org.example.inventory.repository;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("stock")
public record StockEntity(
    @Id Long sku,
    @Column("available_quantity") int availableQuantity,
    @Column("updated_at") Instant updatedAt) {}
