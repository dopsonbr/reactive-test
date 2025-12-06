package org.example.order.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Domain model for an order. */
public record Order(
    UUID id,
    int storeNumber,
    String orderNumber,
    String customerId,
    FulfillmentType fulfillmentType,
    Instant fulfillmentDate,
    UUID reservationId,
    BigDecimal subtotal,
    BigDecimal discountTotal,
    BigDecimal taxTotal,
    BigDecimal fulfillmentCost,
    BigDecimal grandTotal,
    PaymentStatus paymentStatus,
    String paymentMethod,
    String paymentReference,
    OrderStatus status,
    List<OrderLineItem> lineItems,
    List<AppliedDiscount> appliedDiscounts,
    CustomerSnapshot customerSnapshot,
    FulfillmentDetails fulfillmentDetails,
    Instant createdAt,
    Instant updatedAt,
    String createdBy,
    UUID sessionId) {

  public static Builder builder() {
    return new Builder();
  }

  /** Creates a new order with updated status. */
  public Order withStatus(OrderStatus newStatus) {
    return new Order(
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
        newStatus,
        lineItems,
        appliedDiscounts,
        customerSnapshot,
        fulfillmentDetails,
        createdAt,
        Instant.now(),
        createdBy,
        sessionId);
  }

  /** Creates a new order with updated fulfillment details. */
  public Order withFulfillmentDetails(FulfillmentDetails newDetails) {
    return new Order(
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
        lineItems,
        appliedDiscounts,
        customerSnapshot,
        newDetails,
        createdAt,
        Instant.now(),
        createdBy,
        sessionId);
  }

  public static class Builder {
    private UUID id;
    private int storeNumber;
    private String orderNumber;
    private String customerId;
    private FulfillmentType fulfillmentType;
    private Instant fulfillmentDate;
    private UUID reservationId;
    private BigDecimal subtotal = BigDecimal.ZERO;
    private BigDecimal discountTotal = BigDecimal.ZERO;
    private BigDecimal taxTotal = BigDecimal.ZERO;
    private BigDecimal fulfillmentCost = BigDecimal.ZERO;
    private BigDecimal grandTotal = BigDecimal.ZERO;
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    private String paymentMethod;
    private String paymentReference;
    private OrderStatus status = OrderStatus.CREATED;
    private List<OrderLineItem> lineItems = List.of();
    private List<AppliedDiscount> appliedDiscounts = List.of();
    private CustomerSnapshot customerSnapshot;
    private FulfillmentDetails fulfillmentDetails;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private UUID sessionId;

    public Builder id(UUID id) {
      this.id = id;
      return this;
    }

    public Builder storeNumber(int storeNumber) {
      this.storeNumber = storeNumber;
      return this;
    }

    public Builder orderNumber(String orderNumber) {
      this.orderNumber = orderNumber;
      return this;
    }

    public Builder customerId(String customerId) {
      this.customerId = customerId;
      return this;
    }

    public Builder fulfillmentType(FulfillmentType fulfillmentType) {
      this.fulfillmentType = fulfillmentType;
      return this;
    }

    public Builder fulfillmentDate(Instant fulfillmentDate) {
      this.fulfillmentDate = fulfillmentDate;
      return this;
    }

    public Builder reservationId(UUID reservationId) {
      this.reservationId = reservationId;
      return this;
    }

    public Builder subtotal(BigDecimal subtotal) {
      this.subtotal = subtotal;
      return this;
    }

    public Builder discountTotal(BigDecimal discountTotal) {
      this.discountTotal = discountTotal;
      return this;
    }

    public Builder taxTotal(BigDecimal taxTotal) {
      this.taxTotal = taxTotal;
      return this;
    }

    public Builder fulfillmentCost(BigDecimal fulfillmentCost) {
      this.fulfillmentCost = fulfillmentCost;
      return this;
    }

    public Builder grandTotal(BigDecimal grandTotal) {
      this.grandTotal = grandTotal;
      return this;
    }

    public Builder paymentStatus(PaymentStatus paymentStatus) {
      this.paymentStatus = paymentStatus;
      return this;
    }

    public Builder paymentMethod(String paymentMethod) {
      this.paymentMethod = paymentMethod;
      return this;
    }

    public Builder paymentReference(String paymentReference) {
      this.paymentReference = paymentReference;
      return this;
    }

    public Builder status(OrderStatus status) {
      this.status = status;
      return this;
    }

    public Builder lineItems(List<OrderLineItem> lineItems) {
      this.lineItems = lineItems;
      return this;
    }

    public Builder appliedDiscounts(List<AppliedDiscount> appliedDiscounts) {
      this.appliedDiscounts = appliedDiscounts;
      return this;
    }

    public Builder customerSnapshot(CustomerSnapshot customerSnapshot) {
      this.customerSnapshot = customerSnapshot;
      return this;
    }

    public Builder fulfillmentDetails(FulfillmentDetails fulfillmentDetails) {
      this.fulfillmentDetails = fulfillmentDetails;
      return this;
    }

    public Builder createdAt(Instant createdAt) {
      this.createdAt = createdAt;
      return this;
    }

    public Builder updatedAt(Instant updatedAt) {
      this.updatedAt = updatedAt;
      return this;
    }

    public Builder createdBy(String createdBy) {
      this.createdBy = createdBy;
      return this;
    }

    public Builder sessionId(UUID sessionId) {
      this.sessionId = sessionId;
      return this;
    }

    public Order build() {
      return new Order(
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
          lineItems,
          appliedDiscounts,
          customerSnapshot,
          fulfillmentDetails,
          createdAt,
          updatedAt,
          createdBy,
          sessionId);
    }
  }
}
