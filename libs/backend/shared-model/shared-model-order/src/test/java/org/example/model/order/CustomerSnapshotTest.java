package org.example.model.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class CustomerSnapshotTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void shouldSerializeToJson() throws Exception {
    CustomerSnapshot customer =
        new CustomerSnapshot("cust-123", "John", "Doe", "john@example.com", "555-1234", "GOLD");

    String json = objectMapper.writeValueAsString(customer);

    assertThat(json).contains("cust-123");
    assertThat(json).contains("John");
    assertThat(json).contains("GOLD");
  }

  @Test
  void shouldDeserializeFromJson() throws Exception {
    String json =
        """
        {
          "customerId": "cust-123",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "phone": "555-1234",
          "loyaltyTier": "GOLD"
        }
        """;

    CustomerSnapshot customer = objectMapper.readValue(json, CustomerSnapshot.class);

    assertThat(customer.customerId()).isEqualTo("cust-123");
    assertThat(customer.firstName()).isEqualTo("John");
    assertThat(customer.loyaltyTier()).isEqualTo("GOLD");
  }
}
