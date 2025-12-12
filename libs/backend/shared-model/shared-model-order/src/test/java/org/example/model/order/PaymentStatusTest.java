package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PaymentStatusTest {

  @Test
  void shouldHaveExpectedStatuses() {
    assertThat(PaymentStatus.values())
        .containsExactlyInAnyOrder(
            PaymentStatus.PENDING,
            PaymentStatus.AUTHORIZED,
            PaymentStatus.COMPLETED,
            PaymentStatus.FAILED,
            PaymentStatus.REFUNDED);
  }
}
