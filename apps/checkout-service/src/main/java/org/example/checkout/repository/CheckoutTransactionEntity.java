package org.example.checkout.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.example.checkout.model.CheckoutTransactionStatus;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/** Entity for checkout transaction log. */
@Table("checkout_transactions")
public class CheckoutTransactionEntity {

  @Id private UUID id;

  @Column("checkout_session_id")
  private String checkoutSessionId;

  @Column("cart_id")
  private String cartId;

  @Column("store_number")
  private int storeNumber;

  @Column("order_id")
  private UUID orderId;

  @Column("status")
  private CheckoutTransactionStatus status;

  @Column("failure_reason")
  private String failureReason;

  @Column("grand_total")
  private BigDecimal grandTotal;

  @Column("item_count")
  private int itemCount;

  @Column("payment_method")
  private String paymentMethod;

  @Column("payment_reference")
  private String paymentReference;

  @Column("event_published")
  private boolean eventPublished;

  @Column("event_publish_attempts")
  private int eventPublishAttempts;

  @Column("last_publish_attempt")
  private Instant lastPublishAttempt;

  @Column("initiated_at")
  private Instant initiatedAt;

  @Column("completed_at")
  private Instant completedAt;

  @Column("created_at")
  private Instant createdAt;

  @Column("updated_at")
  private Instant updatedAt;

  // Getters and setters
  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getCheckoutSessionId() {
    return checkoutSessionId;
  }

  public void setCheckoutSessionId(String checkoutSessionId) {
    this.checkoutSessionId = checkoutSessionId;
  }

  public String getCartId() {
    return cartId;
  }

  public void setCartId(String cartId) {
    this.cartId = cartId;
  }

  public int getStoreNumber() {
    return storeNumber;
  }

  public void setStoreNumber(int storeNumber) {
    this.storeNumber = storeNumber;
  }

  public UUID getOrderId() {
    return orderId;
  }

  public void setOrderId(UUID orderId) {
    this.orderId = orderId;
  }

  public CheckoutTransactionStatus getStatus() {
    return status;
  }

  public void setStatus(CheckoutTransactionStatus status) {
    this.status = status;
  }

  public String getFailureReason() {
    return failureReason;
  }

  public void setFailureReason(String failureReason) {
    this.failureReason = failureReason;
  }

  public BigDecimal getGrandTotal() {
    return grandTotal;
  }

  public void setGrandTotal(BigDecimal grandTotal) {
    this.grandTotal = grandTotal;
  }

  public int getItemCount() {
    return itemCount;
  }

  public void setItemCount(int itemCount) {
    this.itemCount = itemCount;
  }

  public String getPaymentMethod() {
    return paymentMethod;
  }

  public void setPaymentMethod(String paymentMethod) {
    this.paymentMethod = paymentMethod;
  }

  public String getPaymentReference() {
    return paymentReference;
  }

  public void setPaymentReference(String paymentReference) {
    this.paymentReference = paymentReference;
  }

  public boolean isEventPublished() {
    return eventPublished;
  }

  public void setEventPublished(boolean eventPublished) {
    this.eventPublished = eventPublished;
  }

  public int getEventPublishAttempts() {
    return eventPublishAttempts;
  }

  public void setEventPublishAttempts(int eventPublishAttempts) {
    this.eventPublishAttempts = eventPublishAttempts;
  }

  public Instant getLastPublishAttempt() {
    return lastPublishAttempt;
  }

  public void setLastPublishAttempt(Instant lastPublishAttempt) {
    this.lastPublishAttempt = lastPublishAttempt;
  }

  public Instant getInitiatedAt() {
    return initiatedAt;
  }

  public void setInitiatedAt(Instant initiatedAt) {
    this.initiatedAt = initiatedAt;
  }

  public Instant getCompletedAt() {
    return completedAt;
  }

  public void setCompletedAt(Instant completedAt) {
    this.completedAt = completedAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public void incrementPublishAttempts() {
    this.eventPublishAttempts++;
    this.lastPublishAttempt = Instant.now();
  }
}
