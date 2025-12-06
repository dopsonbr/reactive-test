package org.example.order.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.order.model.FulfillmentType;
import org.example.order.model.Order;
import org.example.order.model.OrderStatus;
import org.example.order.model.PaymentStatus;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/** Unit tests for OrderSearchResponse factory method. */
class OrderSearchResponseTest {

  @Nested
  class FactoryMethod {

    @Test
    void emptyResults_hasMoreFalse() {
      OrderSearchResponse response = OrderSearchResponse.of(List.of(), 0, 0, 20);

      assertThat(response.orders()).isEmpty();
      assertThat(response.totalCount()).isEqualTo(0);
      assertThat(response.page()).isEqualTo(0);
      assertThat(response.size()).isEqualTo(20);
      assertThat(response.hasMore()).isFalse();
    }

    @Test
    void singlePage_hasMoreFalse() {
      List<Order> orders = List.of(createTestOrder());
      OrderSearchResponse response = OrderSearchResponse.of(orders, 1, 0, 20);

      assertThat(response.orders()).hasSize(1);
      assertThat(response.totalCount()).isEqualTo(1);
      assertThat(response.hasMore()).isFalse();
    }

    @Test
    void exactlyOnePage_hasMoreFalse() {
      List<Order> orders = List.of(createTestOrder(), createTestOrder());
      OrderSearchResponse response = OrderSearchResponse.of(orders, 2, 0, 2);

      assertThat(response.orders()).hasSize(2);
      assertThat(response.totalCount()).isEqualTo(2);
      assertThat(response.hasMore()).isFalse();
    }

    @Test
    void morePagesAvailable_hasMoreTrue() {
      List<Order> orders = List.of(createTestOrder(), createTestOrder());
      // Page 0, size 2, but total is 5 - there are more pages
      OrderSearchResponse response = OrderSearchResponse.of(orders, 5, 0, 2);

      assertThat(response.orders()).hasSize(2);
      assertThat(response.totalCount()).isEqualTo(5);
      assertThat(response.page()).isEqualTo(0);
      assertThat(response.size()).isEqualTo(2);
      assertThat(response.hasMore()).isTrue();
    }

    @Test
    void lastPage_hasMoreFalse() {
      List<Order> orders = List.of(createTestOrder());
      // Page 2, size 2, total 5: pages 0(2), 1(2), 2(1) - this is the last page
      OrderSearchResponse response = OrderSearchResponse.of(orders, 5, 2, 2);

      assertThat(response.hasMore()).isFalse();
    }

    @Test
    void middlePage_hasMoreTrue() {
      List<Order> orders = List.of(createTestOrder(), createTestOrder());
      // Page 1, size 2, total 10: pages 0(2), 1(2), 2(2), 3(2), 4(2) - more pages exist
      OrderSearchResponse response = OrderSearchResponse.of(orders, 10, 1, 2);

      assertThat(response.page()).isEqualTo(1);
      assertThat(response.hasMore()).isTrue();
    }

    @Test
    void boundaryCondition_exactFit() {
      List<Order> orders = List.of(createTestOrder(), createTestOrder());
      // Page 1, size 2, total 4: pages 0(2), 1(2) - exactly fits, no more
      OrderSearchResponse response = OrderSearchResponse.of(orders, 4, 1, 2);

      assertThat(response.hasMore()).isFalse();
    }
  }

  @Nested
  class RecordFields {

    @Test
    void preservesAllFields() {
      List<Order> orders = List.of(createTestOrder());
      OrderSearchResponse response = new OrderSearchResponse(orders, 100L, 5, 20, true);

      assertThat(response.orders()).hasSize(1);
      assertThat(response.totalCount()).isEqualTo(100L);
      assertThat(response.page()).isEqualTo(5);
      assertThat(response.size()).isEqualTo(20);
      assertThat(response.hasMore()).isTrue();
    }
  }

  private Order createTestOrder() {
    return Order.builder()
        .id(UUID.randomUUID())
        .storeNumber(100)
        .orderNumber("ORD-" + System.nanoTime())
        .customerId("cust-123")
        .fulfillmentType(FulfillmentType.DELIVERY)
        .subtotal(BigDecimal.valueOf(100.00))
        .discountTotal(BigDecimal.ZERO)
        .taxTotal(BigDecimal.valueOf(8.00))
        .fulfillmentCost(BigDecimal.valueOf(5.00))
        .grandTotal(BigDecimal.valueOf(113.00))
        .paymentStatus(PaymentStatus.CAPTURED)
        .status(OrderStatus.CREATED)
        .lineItems(List.of())
        .appliedDiscounts(List.of())
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }
}
