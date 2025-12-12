package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class OrderStatusTest {

  @Test
  void shouldHaveExpectedStatuses() {
    assertThat(OrderStatus.values())
        .containsExactlyInAnyOrder(
            OrderStatus.CREATED,
            OrderStatus.PAID,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED,
            OrderStatus.REFUNDED);
  }
}
