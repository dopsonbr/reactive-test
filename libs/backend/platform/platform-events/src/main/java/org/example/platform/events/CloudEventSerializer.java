package org.example.platform.events;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.cloudevents.CloudEvent;
import io.cloudevents.core.builder.CloudEventBuilder;
import java.io.IOException;
import java.net.URI;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** Serializes and deserializes CloudEvents using Jackson. */
public class CloudEventSerializer {

  private static final String DATA_CONTENT_TYPE = "application/json";

  private final ObjectMapper objectMapper;

  public CloudEventSerializer(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  /**
   * Serialize a CloudEvent to JSON string.
   *
   * @param event the CloudEvent to serialize
   * @return JSON string representation
   */
  public String serialize(CloudEvent event) {
    try {
      Map<String, Object> map = new LinkedHashMap<>();
      map.put("specversion", event.getSpecVersion().toString());
      map.put("id", event.getId());
      map.put("source", event.getSource().toString());
      map.put("type", event.getType());

      if (event.getSubject() != null) {
        map.put("subject", event.getSubject());
      }
      if (event.getTime() != null) {
        map.put("time", event.getTime().toString());
      }
      if (event.getDataContentType() != null) {
        map.put("datacontenttype", event.getDataContentType());
      }
      if (event.getDataSchema() != null) {
        map.put("dataschema", event.getDataSchema().toString());
      }
      if (event.getData() != null) {
        byte[] dataBytes = event.getData().toBytes();
        Object dataObj = objectMapper.readValue(dataBytes, Object.class);
        map.put("data", dataObj);
      }

      return objectMapper.writeValueAsString(map);
    } catch (IOException e) {
      throw new EventSerializationException("Failed to serialize CloudEvent", e);
    }
  }

  /**
   * Deserialize JSON string to CloudEvent.
   *
   * @param json JSON string
   * @return CloudEvent instance
   */
  @SuppressWarnings("unchecked")
  public CloudEvent deserialize(String json) {
    try {
      Map<String, Object> map = objectMapper.readValue(json, Map.class);

      CloudEventBuilder builder =
          CloudEventBuilder.v1()
              .withId((String) map.get("id"))
              .withSource(URI.create((String) map.get("source")))
              .withType((String) map.get("type"));

      if (map.containsKey("subject")) {
        builder.withSubject((String) map.get("subject"));
      }
      if (map.containsKey("time")) {
        builder.withTime(OffsetDateTime.parse((String) map.get("time")));
      }
      if (map.containsKey("datacontenttype")) {
        builder.withDataContentType((String) map.get("datacontenttype"));
      }
      if (map.containsKey("dataschema")) {
        builder.withDataSchema(URI.create((String) map.get("dataschema")));
      }
      if (map.containsKey("data")) {
        byte[] dataBytes = objectMapper.writeValueAsBytes(map.get("data"));
        builder.withData(DATA_CONTENT_TYPE, dataBytes);
      }

      return builder.build();
    } catch (IOException e) {
      throw new EventSerializationException("Failed to deserialize CloudEvent", e);
    }
  }

  /**
   * Extract typed data from CloudEvent.
   *
   * @param event the CloudEvent
   * @param dataType the expected data type class
   * @return deserialized data object
   */
  public <T> T extractData(CloudEvent event, Class<T> dataType) {
    if (event.getData() == null) {
      return null;
    }
    try {
      return objectMapper.readValue(event.getData().toBytes(), dataType);
    } catch (Exception e) {
      throw new EventSerializationException("Failed to extract data from CloudEvent", e);
    }
  }

  /**
   * Build a CloudEvent with typed data.
   *
   * @param type event type (e.g., "org.example.OrderCompleted")
   * @param source event source URI
   * @param subject event subject (e.g., order ID)
   * @param data typed data object
   * @return CloudEvent instance
   */
  public <T> CloudEvent buildEvent(String type, URI source, String subject, T data) {
    try {
      byte[] dataBytes = objectMapper.writeValueAsBytes(data);

      return CloudEventBuilder.v1()
          .withId(UUID.randomUUID().toString())
          .withSource(source)
          .withType(type)
          .withSubject(subject)
          .withTime(OffsetDateTime.now())
          .withDataContentType(DATA_CONTENT_TYPE)
          .withData(DATA_CONTENT_TYPE, dataBytes)
          .build();
    } catch (JsonProcessingException e) {
      throw new EventSerializationException("Failed to build CloudEvent", e);
    }
  }

  /** Exception thrown when event serialization/deserialization fails. */
  public static class EventSerializationException extends RuntimeException {
    public EventSerializationException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
