package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class FulfillmentTypeTest {

  @Test
  void shouldHaveExpectedTypes() {
    assertThat(FulfillmentType.values())
        .containsExactlyInAnyOrder(
            FulfillmentType.DELIVERY, FulfillmentType.PICKUP, FulfillmentType.IMMEDIATE);
  }
}
