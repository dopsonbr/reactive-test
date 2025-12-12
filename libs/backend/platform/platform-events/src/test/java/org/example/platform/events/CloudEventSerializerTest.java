package org.example.platform.events;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.cloudevents.CloudEvent;
import io.cloudevents.core.builder.CloudEventBuilder;
import java.net.URI;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CloudEventSerializerTest {

  private CloudEventSerializer serializer;
  private ObjectMapper objectMapper;

  @BeforeEach
  void setUp() {
    objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    serializer = new CloudEventSerializer(objectMapper);
  }

  @Test
  void shouldSerializeCloudEventToJson() {
    CloudEvent event =
        CloudEventBuilder.v1()
            .withId(UUID.randomUUID().toString())
            .withSource(URI.create("urn:example:checkout-service"))
            .withType("org.example.OrderCompleted")
            .withData("application/json", "{\"orderId\":\"123\"}".getBytes())
            .build();

    String json = serializer.serialize(event);

    assertThat(json).contains("org.example.OrderCompleted");
    assertThat(json).contains("urn:example:checkout-service");
    assertThat(json).contains("orderId");
  }

  @Test
  void shouldDeserializeJsonToCloudEvent() {
    String json =
        """
        {
          "specversion": "1.0",
          "id": "test-id-123",
          "source": "urn:example:checkout-service",
          "type": "org.example.OrderCompleted",
          "datacontenttype": "application/json",
          "data": {"orderId": "123"}
        }
        """;

    CloudEvent event = serializer.deserialize(json);

    assertThat(event.getId()).isEqualTo("test-id-123");
    assertThat(event.getSource().toString()).isEqualTo("urn:example:checkout-service");
    assertThat(event.getType()).isEqualTo("org.example.OrderCompleted");
  }

  @Test
  void shouldExtractTypedDataFromCloudEvent() {
    record TestData(String orderId, int amount) {}

    CloudEvent event =
        CloudEventBuilder.v1()
            .withId("test-id")
            .withSource(URI.create("urn:test"))
            .withType("test.event")
            .withData("application/json", "{\"orderId\":\"ABC\",\"amount\":100}".getBytes())
            .build();

    TestData data = serializer.extractData(event, TestData.class);

    assertThat(data.orderId()).isEqualTo("ABC");
    assertThat(data.amount()).isEqualTo(100);
  }

  @Test
  void shouldBuildCloudEventWithTypedData() {
    record OrderData(String orderId) {}
    OrderData data = new OrderData("ORD-123");

    CloudEvent event =
        serializer.buildEvent(
            "org.example.OrderCompleted",
            URI.create("urn:example:checkout-service"),
            "ORD-123",
            data);

    assertThat(event.getType()).isEqualTo("org.example.OrderCompleted");
    assertThat(event.getSubject()).isEqualTo("ORD-123");
    assertThat(new String(event.getData().toBytes())).contains("ORD-123");
  }
}
