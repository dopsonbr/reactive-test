package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OrderTest {

  private final ObjectMapper objectMapper =
      new ObjectMapper().registerModule(new JavaTimeModule());

  @Test
  void shouldBuildOrder() {
    UUID orderId = UUID.randomUUID();
    Instant now = Instant.now();

    Order order =
        Order.builder()
            .id(orderId)
            .storeNumber(100)
            .orderNumber("ORD-001")
            .grandTotal(new BigDecimal("99.99"))
            .status(OrderStatus.PAID)
            .paymentStatus(PaymentStatus.COMPLETED)
            .createdAt(now)
            .build();

    assertThat(order.id()).isEqualTo(orderId);
    assertThat(order.storeNumber()).isEqualTo(100);
    assertThat(order.orderNumber()).isEqualTo("ORD-001");
    assertThat(order.grandTotal()).isEqualByComparingTo(new BigDecimal("99.99"));
    assertThat(order.status()).isEqualTo(OrderStatus.PAID);
  }

  @Test
  void shouldSerializeToJson() throws Exception {
    Order order =
        Order.builder()
            .id(UUID.fromString("11111111-1111-1111-1111-111111111111"))
            .storeNumber(100)
            .orderNumber("ORD-001")
            .grandTotal(new BigDecimal("99.99"))
            .status(OrderStatus.PAID)
            .paymentStatus(PaymentStatus.COMPLETED)
            .lineItems(List.of())
            .appliedDiscounts(List.of())
            .createdAt(Instant.parse("2025-01-01T12:00:00Z"))
            .build();

    String json = objectMapper.writeValueAsString(order);

    assertThat(json).contains("11111111-1111-1111-1111-111111111111");
    assertThat(json).contains("ORD-001");
    assertThat(json).contains("99.99");
    assertThat(json).contains("PAID");
  }

  @Test
  void shouldDeserializeFromJson() throws Exception {
    String json =
        """
        {
          "id": "11111111-1111-1111-1111-111111111111",
          "storeNumber": 100,
          "orderNumber": "ORD-001",
          "grandTotal": 99.99,
          "status": "PAID",
          "paymentStatus": "COMPLETED",
          "lineItems": [],
          "appliedDiscounts": [],
          "createdAt": "2025-01-01T12:00:00Z"
        }
        """;

    Order order = objectMapper.readValue(json, Order.class);

    assertThat(order.orderNumber()).isEqualTo("ORD-001");
    assertThat(order.status()).isEqualTo(OrderStatus.PAID);
  }
}
