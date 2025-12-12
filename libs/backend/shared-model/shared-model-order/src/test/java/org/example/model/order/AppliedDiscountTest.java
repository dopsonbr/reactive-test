package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class AppliedDiscountTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void shouldSerializeToJson() throws Exception {
    AppliedDiscount discount =
        new AppliedDiscount("disc-123", "SAVE20", "20% off", "PERCENTAGE", new BigDecimal("15.00"));

    String json = objectMapper.writeValueAsString(discount);

    assertThat(json).contains("SAVE20");
    assertThat(json).contains("15.00");
  }

  @Test
  void shouldDeserializeFromJson() throws Exception {
    String json =
        """
        {
          "discountId": "disc-123",
          "code": "SAVE20",
          "description": "20% off",
          "type": "PERCENTAGE",
          "appliedAmount": 15.00
        }
        """;

    AppliedDiscount discount = objectMapper.readValue(json, AppliedDiscount.class);

    assertThat(discount.code()).isEqualTo("SAVE20");
    assertThat(discount.appliedAmount()).isEqualByComparingTo(new BigDecimal("15.00"));
  }
}
