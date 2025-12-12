package org.example.checkout.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.example.checkout.model.CheckoutTransactionStatus;
import org.junit.jupiter.api.Test;

class CheckoutTransactionEntityTest {

  @Test
  void shouldCreateEntity() {
    UUID id = UUID.randomUUID();
    Instant now = Instant.now();

    CheckoutTransactionEntity entity = new CheckoutTransactionEntity();
    entity.setId(id);
    entity.setCheckoutSessionId("session-123");
    entity.setCartId("cart-456");
    entity.setStoreNumber(100);
    entity.setStatus(CheckoutTransactionStatus.INITIATED);
    entity.setGrandTotal(new BigDecimal("99.99"));
    entity.setItemCount(3);
    entity.setInitiatedAt(now);

    assertThat(entity.getId()).isEqualTo(id);
    assertThat(entity.getCheckoutSessionId()).isEqualTo("session-123");
    assertThat(entity.getStatus()).isEqualTo(CheckoutTransactionStatus.INITIATED);
    assertThat(entity.getGrandTotal()).isEqualByComparingTo(new BigDecimal("99.99"));
  }

  @Test
  void shouldTrackEventPublishing() {
    CheckoutTransactionEntity entity = new CheckoutTransactionEntity();
    entity.setEventPublished(false);
    entity.setEventPublishAttempts(0);

    entity.incrementPublishAttempts();

    assertThat(entity.getEventPublishAttempts()).isEqualTo(1);
    assertThat(entity.getLastPublishAttempt()).isNotNull();
  }
}
