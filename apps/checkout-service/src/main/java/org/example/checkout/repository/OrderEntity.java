package org.example.checkout.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Database entity for Order.
 *
 * <p>This entity maps to the 'orders' table and uses JSONB columns for denormalized data to
 * maintain flexibility while using Postgres for fast transactional writes.
 *
 * <p>Implements Persistable to allow Spring Data R2DBC to distinguish between INSERT and UPDATE
 * operations when the ID is pre-assigned.
 *
 * <p>JSON columns use JsonValue wrapper type to enable proper R2DBC conversion to PostgreSQL JSONB.
 */
@Table("orders")
public class OrderEntity implements Persistable<UUID> {

  @Id private UUID id;

  @Column("store_number")
  private int storeNumber;

  @Column("order_number")
  private String orderNumber;

  @Column("customer_id")
  private String customerId;

  @Column("fulfillment_type")
  private String fulfillmentType;

  @Column("fulfillment_date")
  private Instant fulfillmentDate;

  @Column("reservation_id")
  private UUID reservationId;

  @Column("subtotal")
  private BigDecimal subtotal;

  @Column("discount_total")
  private BigDecimal discountTotal;

  @Column("tax_total")
  private BigDecimal taxTotal;

  @Column("fulfillment_cost")
  private BigDecimal fulfillmentCost;

  @Column("grand_total")
  private BigDecimal grandTotal;

  @Column("payment_status")
  private String paymentStatus;

  @Column("payment_method")
  private String paymentMethod;

  @Column("payment_reference")
  private String paymentReference;

  @Column("status")
  private String status;

  @Column("line_items")
  private JsonValue lineItems;

  @Column("applied_discounts")
  private JsonValue appliedDiscounts;

  @Column("customer_snapshot")
  private JsonValue customerSnapshot;

  @Column("fulfillment_details")
  private JsonValue fulfillmentDetails;

  @Column("created_at")
  private Instant createdAt;

  @Column("updated_at")
  private Instant updatedAt;

  @Column("created_by")
  private String createdBy;

  @Column("session_id")
  private UUID sessionId;

  @Transient private boolean isNewEntity = false;

  // Default constructor for Spring Data
  public OrderEntity() {}

  // Private all-args constructor for factory methods
  private OrderEntity(
      UUID id,
      int storeNumber,
      String orderNumber,
      String customerId,
      String fulfillmentType,
      Instant fulfillmentDate,
      UUID reservationId,
      BigDecimal subtotal,
      BigDecimal discountTotal,
      BigDecimal taxTotal,
      BigDecimal fulfillmentCost,
      BigDecimal grandTotal,
      String paymentStatus,
      String paymentMethod,
      String paymentReference,
      String status,
      JsonValue lineItems,
      JsonValue appliedDiscounts,
      JsonValue customerSnapshot,
      JsonValue fulfillmentDetails,
      Instant createdAt,
      Instant updatedAt,
      String createdBy,
      UUID sessionId,
      boolean isNewEntity) {
    this.id = id;
    this.storeNumber = storeNumber;
    this.orderNumber = orderNumber;
    this.customerId = customerId;
    this.fulfillmentType = fulfillmentType;
    this.fulfillmentDate = fulfillmentDate;
    this.reservationId = reservationId;
    this.subtotal = subtotal;
    this.discountTotal = discountTotal;
    this.taxTotal = taxTotal;
    this.fulfillmentCost = fulfillmentCost;
    this.grandTotal = grandTotal;
    this.paymentStatus = paymentStatus;
    this.paymentMethod = paymentMethod;
    this.paymentReference = paymentReference;
    this.status = status;
    this.lineItems = lineItems;
    this.appliedDiscounts = appliedDiscounts;
    this.customerSnapshot = customerSnapshot;
    this.fulfillmentDetails = fulfillmentDetails;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.sessionId = sessionId;
    this.isNewEntity = isNewEntity;
  }

  /** Factory method for creating new entities (will INSERT). */
  public static OrderEntity createNew(
      UUID id,
      int storeNumber,
      String orderNumber,
      String customerId,
      String fulfillmentType,
      Instant fulfillmentDate,
      UUID reservationId,
      BigDecimal subtotal,
      BigDecimal discountTotal,
      BigDecimal taxTotal,
      BigDecimal fulfillmentCost,
      BigDecimal grandTotal,
      String paymentStatus,
      String paymentMethod,
      String paymentReference,
      String status,
      String lineItemsJson,
      String appliedDiscountsJson,
      String customerSnapshotJson,
      String fulfillmentDetailsJson,
      Instant createdAt,
      Instant updatedAt,
      String createdBy,
      UUID sessionId) {
    return new OrderEntity(
        id,
        storeNumber,
        orderNumber,
        customerId,
        fulfillmentType,
        fulfillmentDate,
        reservationId,
        subtotal,
        discountTotal,
        taxTotal,
        fulfillmentCost,
        grandTotal,
        paymentStatus,
        paymentMethod,
        paymentReference,
        status,
        JsonValue.of(lineItemsJson),
        JsonValue.of(appliedDiscountsJson),
        JsonValue.of(customerSnapshotJson),
        JsonValue.of(fulfillmentDetailsJson),
        createdAt,
        updatedAt,
        createdBy,
        sessionId,
        true);
  }

  /** Factory method for existing entities (will UPDATE). */
  public static OrderEntity existing(
      UUID id,
      int storeNumber,
      String orderNumber,
      String customerId,
      String fulfillmentType,
      Instant fulfillmentDate,
      UUID reservationId,
      BigDecimal subtotal,
      BigDecimal discountTotal,
      BigDecimal taxTotal,
      BigDecimal fulfillmentCost,
      BigDecimal grandTotal,
      String paymentStatus,
      String paymentMethod,
      String paymentReference,
      String status,
      String lineItemsJson,
      String appliedDiscountsJson,
      String customerSnapshotJson,
      String fulfillmentDetailsJson,
      Instant createdAt,
      Instant updatedAt,
      String createdBy,
      UUID sessionId) {
    return new OrderEntity(
        id,
        storeNumber,
        orderNumber,
        customerId,
        fulfillmentType,
        fulfillmentDate,
        reservationId,
        subtotal,
        discountTotal,
        taxTotal,
        fulfillmentCost,
        grandTotal,
        paymentStatus,
        paymentMethod,
        paymentReference,
        status,
        JsonValue.of(lineItemsJson),
        JsonValue.of(appliedDiscountsJson),
        JsonValue.of(customerSnapshotJson),
        JsonValue.of(fulfillmentDetailsJson),
        createdAt,
        updatedAt,
        createdBy,
        sessionId,
        false);
  }

  @Override
  public UUID getId() {
    return id;
  }

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

  public String orderNumber() {
    return orderNumber;
  }

  public String customerId() {
    return customerId;
  }

  public String fulfillmentType() {
    return fulfillmentType;
  }

  public Instant fulfillmentDate() {
    return fulfillmentDate;
  }

  public UUID reservationId() {
    return reservationId;
  }

  public BigDecimal subtotal() {
    return subtotal;
  }

  public BigDecimal discountTotal() {
    return discountTotal;
  }

  public BigDecimal taxTotal() {
    return taxTotal;
  }

  public BigDecimal fulfillmentCost() {
    return fulfillmentCost;
  }

  public BigDecimal grandTotal() {
    return grandTotal;
  }

  public String paymentStatus() {
    return paymentStatus;
  }

  public String paymentMethod() {
    return paymentMethod;
  }

  public String paymentReference() {
    return paymentReference;
  }

  public String status() {
    return status;
  }

  public JsonValue lineItems() {
    return lineItems;
  }

  public JsonValue appliedDiscounts() {
    return appliedDiscounts;
  }

  public JsonValue customerSnapshot() {
    return customerSnapshot;
  }

  public JsonValue fulfillmentDetails() {
    return fulfillmentDetails;
  }

  public Instant createdAt() {
    return createdAt;
  }

  public Instant updatedAt() {
    return updatedAt;
  }

  public String createdBy() {
    return createdBy;
  }

  public UUID sessionId() {
    return sessionId;
  }
}
