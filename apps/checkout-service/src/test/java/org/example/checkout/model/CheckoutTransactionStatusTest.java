package org.example.checkout.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CheckoutTransactionStatusTest {

  @Test
  void shouldHaveExpectedStatuses() {
    assertThat(CheckoutTransactionStatus.values())
        .containsExactlyInAnyOrder(
            CheckoutTransactionStatus.INITIATED,
            CheckoutTransactionStatus.PAYMENT_PROCESSING,
            CheckoutTransactionStatus.COMPLETED,
            CheckoutTransactionStatus.FAILED,
            CheckoutTransactionStatus.RETRY_PENDING);
  }

  @Test
  void shouldIdentifyTerminalStatuses() {
    assertThat(CheckoutTransactionStatus.COMPLETED.isTerminal()).isTrue();
    assertThat(CheckoutTransactionStatus.FAILED.isTerminal()).isTrue();
    assertThat(CheckoutTransactionStatus.INITIATED.isTerminal()).isFalse();
    assertThat(CheckoutTransactionStatus.PAYMENT_PROCESSING.isTerminal()).isFalse();
    assertThat(CheckoutTransactionStatus.RETRY_PENDING.isTerminal()).isFalse();
  }
}
