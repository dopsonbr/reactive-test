package org.example.cart.repository;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Database entity for Cart.
 *
 * <p>This entity maps to the 'carts' table and uses JSONB columns for nested collections to
 * maintain flexibility while using Postgres.
 */
@Table("carts")
public record CartEntity(
    @Id UUID id,
    @Column("store_number") int storeNumber,
    @Column("customer_id") String customerId,
    @Column("customer_json") String customerJson,
    @Column("products_json") String productsJson,
    @Column("discounts_json") String discountsJson,
    @Column("fulfillments_json") String fulfillmentsJson,
    @Column("totals_json") String totalsJson,
    @Column("created_at") Instant createdAt,
    @Column("updated_at") Instant updatedAt) {}
