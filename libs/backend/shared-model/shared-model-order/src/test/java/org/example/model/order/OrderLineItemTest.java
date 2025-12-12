package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class OrderLineItemTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void shouldCalculateLineTotal() {
    OrderLineItem item =
        OrderLineItem.create(
            "prod-123", "SKU-001", "Widget", 3, new BigDecimal("10.00"), new BigDecimal("2.00"));

    assertThat(item.lineTotal()).isEqualByComparingTo(new BigDecimal("28.00")); // (10 * 3) - 2
  }

  @Test
  void shouldSerializeToJson() throws Exception {
    OrderLineItem item =
        OrderLineItem.create(
            "prod-123", "SKU-001", "Widget", 2, new BigDecimal("25.00"), BigDecimal.ZERO);

    String json = objectMapper.writeValueAsString(item);

    assertThat(json).contains("SKU-001");
    assertThat(json).contains("Widget");
    assertThat(json).contains("25.00");
  }

  @Test
  void shouldDeserializeFromJson() throws Exception {
    String json =
        """
        {
          "productId": "prod-123",
          "sku": "SKU-001",
          "name": "Widget",
          "quantity": 2,
          "unitPrice": 25.00,
          "discountAmount": 5.00
        }
        """;

    OrderLineItem item = objectMapper.readValue(json, OrderLineItem.class);

    assertThat(item.sku()).isEqualTo("SKU-001");
    assertThat(item.quantity()).isEqualTo(2);
    assertThat(item.lineTotal()).isEqualByComparingTo(new BigDecimal("45.00")); // (25 * 2) - 5
  }
}
