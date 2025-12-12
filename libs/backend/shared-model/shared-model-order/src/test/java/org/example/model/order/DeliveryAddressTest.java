package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class DeliveryAddressTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void shouldSerializeToJson() throws Exception {
    DeliveryAddress address =
        new DeliveryAddress("123 Main St", "Apt 4", "Springfield", "IL", "62701", "USA");

    String json = objectMapper.writeValueAsString(address);

    assertThat(json).contains("123 Main St");
    assertThat(json).contains("Springfield");
    assertThat(json).contains("62701");
  }

  @Test
  void shouldDeserializeFromJson() throws Exception {
    String json =
        """
        {
          "street1": "123 Main St",
          "street2": "Apt 4",
          "city": "Springfield",
          "state": "IL",
          "postalCode": "62701",
          "country": "USA"
        }
        """;

    DeliveryAddress address = objectMapper.readValue(json, DeliveryAddress.class);

    assertThat(address.street1()).isEqualTo("123 Main St");
    assertThat(address.city()).isEqualTo("Springfield");
    assertThat(address.postalCode()).isEqualTo("62701");
  }
}
