package org.example.order.graphql.input;

import static org.assertj.core.api.Assertions.assertThat;

import org.example.model.order.OrderStatus;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/** Unit tests for OrderSearchInput default value methods. */
class OrderSearchInputTest {

  @Nested
  class LimitOrDefault {

    @Test
    void nullLimit_returnsDefault() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, null, null);
      assertThat(input.limitOrDefault()).isEqualTo(50);
    }

    @Test
    void zeroLimit_returnsDefault() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, 0, null);
      assertThat(input.limitOrDefault()).isEqualTo(50);
    }

    @Test
    void negativeLimit_returnsDefault() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, -5, null);
      assertThat(input.limitOrDefault()).isEqualTo(50);
    }

    @Test
    void limitAboveMax_returnsDefault() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, 150, null);
      assertThat(input.limitOrDefault()).isEqualTo(50);
    }

    @Test
    void validLimit_returnsProvided() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, 25, null);
      assertThat(input.limitOrDefault()).isEqualTo(25);
    }

    @Test
    void limitAtMin_returnsProvided() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, 1, null);
      assertThat(input.limitOrDefault()).isEqualTo(1);
    }

    @Test
    void limitAtMax_returnsProvided() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, 100, null);
      assertThat(input.limitOrDefault()).isEqualTo(100);
    }
  }

  @Nested
  class OffsetOrDefault {

    @Test
    void nullOffset_returnsDefault() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, null, null);
      assertThat(input.offsetOrDefault()).isEqualTo(0);
    }

    @Test
    void negativeOffset_returnsDefault() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, null, -10);
      assertThat(input.offsetOrDefault()).isEqualTo(0);
    }

    @Test
    void zeroOffset_returnsZero() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, null, 0);
      assertThat(input.offsetOrDefault()).isEqualTo(0);
    }

    @Test
    void positiveOffset_returnsProvided() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, null, 50);
      assertThat(input.offsetOrDefault()).isEqualTo(50);
    }
  }

  @Nested
  class RecordFields {

    @Test
    void allFieldsPreserved() {
      OrderSearchInput input =
          new OrderSearchInput(
              100,
              "cust-123",
              OrderStatus.CREATED,
              "2024-01-01T00:00:00Z",
              "2024-12-31T23:59:59Z",
              25,
              10);

      assertThat(input.storeNumber()).isEqualTo(100);
      assertThat(input.customerId()).isEqualTo("cust-123");
      assertThat(input.status()).isEqualTo(OrderStatus.CREATED);
      assertThat(input.startDate()).isEqualTo("2024-01-01T00:00:00Z");
      assertThat(input.endDate()).isEqualTo("2024-12-31T23:59:59Z");
      assertThat(input.limit()).isEqualTo(25);
      assertThat(input.offset()).isEqualTo(10);
    }
  }
}
