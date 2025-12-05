package org.example.cart.repository;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Database entity for Cart.
 *
 * <p>This entity maps to the 'carts' table and uses JSONB columns for nested collections to
 * maintain flexibility while using Postgres.
 *
 * <p>Implements Persistable to allow Spring Data R2DBC to distinguish between INSERT and UPDATE
 * operations when the ID is pre-assigned.
 *
 * <p>JSON columns use JsonValue wrapper type to enable proper R2DBC conversion to PostgreSQL JSONB.
 */
@Table("carts")
public class CartEntity implements Persistable<UUID> {

  @Id private UUID id;

  @Column("store_number")
  private int storeNumber;

  @Column("customer_id")
  private String customerId;

  @Column("customer_json")
  private JsonValue customerJson;

  @Column("products_json")
  private JsonValue productsJson;

  @Column("discounts_json")
  private JsonValue discountsJson;

  @Column("fulfillments_json")
  private JsonValue fulfillmentsJson;

  @Column("totals_json")
  private JsonValue totalsJson;

  @Column("created_at")
  private Instant createdAt;

  @Column("updated_at")
  private Instant updatedAt;

  @Transient private boolean isNewEntity = false;

  // Default constructor for Spring Data
  public CartEntity() {}

  // All-args constructor for manual creation
  private CartEntity(
      UUID id,
      int storeNumber,
      String customerId,
      JsonValue customerJson,
      JsonValue productsJson,
      JsonValue discountsJson,
      JsonValue fulfillmentsJson,
      JsonValue totalsJson,
      Instant createdAt,
      Instant updatedAt,
      boolean isNewEntity) {
    this.id = id;
    this.storeNumber = storeNumber;
    this.customerId = customerId;
    this.customerJson = customerJson;
    this.productsJson = productsJson;
    this.discountsJson = discountsJson;
    this.fulfillmentsJson = fulfillmentsJson;
    this.totalsJson = totalsJson;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isNewEntity = isNewEntity;
  }

  /** Constructor for creating new entities (will INSERT). */
  public static CartEntity createNew(
      UUID id,
      int storeNumber,
      String customerId,
      String customerJson,
      String productsJson,
      String discountsJson,
      String fulfillmentsJson,
      String totalsJson,
      Instant createdAt,
      Instant updatedAt) {
    return new CartEntity(
        id,
        storeNumber,
        customerId,
        JsonValue.of(customerJson),
        JsonValue.of(productsJson),
        JsonValue.of(discountsJson),
        JsonValue.of(fulfillmentsJson),
        JsonValue.of(totalsJson),
        createdAt,
        updatedAt,
        true);
  }

  /** Constructor for existing entities (will UPDATE). */
  public static CartEntity existing(
      UUID id,
      int storeNumber,
      String customerId,
      String customerJson,
      String productsJson,
      String discountsJson,
      String fulfillmentsJson,
      String totalsJson,
      Instant createdAt,
      Instant updatedAt) {
    return new CartEntity(
        id,
        storeNumber,
        customerId,
        JsonValue.of(customerJson),
        JsonValue.of(productsJson),
        JsonValue.of(discountsJson),
        JsonValue.of(fulfillmentsJson),
        JsonValue.of(totalsJson),
        createdAt,
        updatedAt,
        false);
  }

  @Override
  public UUID getId() {
    return id;
  }

  /** Accessor for id field (record-style). */
  public UUID id() {
    return id;
  }

  @Override
  public boolean isNew() {
    return isNewEntity;
  }

  public int storeNumber() {
    return storeNumber;
  }

  public String customerId() {
    return customerId;
  }

  public JsonValue customerJson() {
    return customerJson;
  }

  public JsonValue productsJson() {
    return productsJson;
  }

  public JsonValue discountsJson() {
    return discountsJson;
  }

  public JsonValue fulfillmentsJson() {
    return fulfillmentsJson;
  }

  public JsonValue totalsJson() {
    return totalsJson;
  }

  public Instant createdAt() {
    return createdAt;
  }

  public Instant updatedAt() {
    return updatedAt;
  }
}
