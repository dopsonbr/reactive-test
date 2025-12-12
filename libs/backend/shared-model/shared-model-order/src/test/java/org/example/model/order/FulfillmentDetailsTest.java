package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class FulfillmentDetailsTest {

  private final ObjectMapper objectMapper =
      new ObjectMapper().registerModule(new JavaTimeModule());

  @Test
  void shouldSerializeDeliveryFulfillment() throws Exception {
    DeliveryAddress address =
        new DeliveryAddress("123 Main St", null, "Springfield", "IL", "62701", "USA");
    FulfillmentDetails details =
        new FulfillmentDetails(
            FulfillmentType.DELIVERY,
            Instant.parse("2025-01-15T10:00:00Z"),
            address,
            null,
            "Leave at door");

    String json = objectMapper.writeValueAsString(details);

    assertThat(json).contains("DELIVERY");
    assertThat(json).contains("123 Main St");
    assertThat(json).contains("Leave at door");
  }

  @Test
  void shouldSerializePickupFulfillment() throws Exception {
    FulfillmentDetails details =
        new FulfillmentDetails(
            FulfillmentType.PICKUP,
            Instant.parse("2025-01-15T14:00:00Z"),
            null,
            "Store #42 - Downtown",
            null);

    String json = objectMapper.writeValueAsString(details);

    assertThat(json).contains("PICKUP");
    assertThat(json).contains("Store #42");
  }
}
