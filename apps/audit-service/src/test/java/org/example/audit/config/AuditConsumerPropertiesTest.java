package org.example.audit.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class AuditConsumerPropertiesTest {

  @Test
  void defaultConstructor_setsDefaults() {
    AuditConsumerProperties properties = new AuditConsumerProperties();

    assertThat(properties.streamKey()).isEqualTo("audit-events");
    assertThat(properties.consumerGroup()).isEqualTo("audit-service");
    assertThat(properties.consumerName()).isEqualTo("audit-consumer-1");
    assertThat(properties.batchSize()).isEqualTo(100);
    assertThat(properties.pollInterval()).isEqualTo(Duration.ofMillis(100));
    assertThat(properties.maxRetries()).isEqualTo(3);
    assertThat(properties.retryDelay()).isEqualTo(Duration.ofSeconds(1));
  }

  @Test
  void constructor_withNullValues_usesDefaults() {
    AuditConsumerProperties properties =
        new AuditConsumerProperties(null, null, null, 0, null, 0, null);

    assertThat(properties.streamKey()).isEqualTo("audit-events");
    assertThat(properties.consumerGroup()).isEqualTo("audit-service");
    assertThat(properties.consumerName()).isEqualTo("audit-consumer-1");
    assertThat(properties.batchSize()).isEqualTo(100);
    assertThat(properties.pollInterval()).isEqualTo(Duration.ofMillis(100));
    assertThat(properties.maxRetries()).isEqualTo(3);
    assertThat(properties.retryDelay()).isEqualTo(Duration.ofSeconds(1));
  }

  @Test
  void constructor_withCustomValues_usesProvidedValues() {
    AuditConsumerProperties properties =
        new AuditConsumerProperties(
            "custom-stream",
            "custom-group",
            "custom-consumer",
            200,
            Duration.ofMillis(500),
            5,
            Duration.ofSeconds(2));

    assertThat(properties.streamKey()).isEqualTo("custom-stream");
    assertThat(properties.consumerGroup()).isEqualTo("custom-group");
    assertThat(properties.consumerName()).isEqualTo("custom-consumer");
    assertThat(properties.batchSize()).isEqualTo(200);
    assertThat(properties.pollInterval()).isEqualTo(Duration.ofMillis(500));
    assertThat(properties.maxRetries()).isEqualTo(5);
    assertThat(properties.retryDelay()).isEqualTo(Duration.ofSeconds(2));
  }

  @Test
  void constructor_withNegativeBatchSize_usesDefault() {
    AuditConsumerProperties properties =
        new AuditConsumerProperties(
            "stream", "group", "consumer", -1, Duration.ofMillis(100), 3, Duration.ofSeconds(1));

    assertThat(properties.batchSize()).isEqualTo(100);
  }

  @Test
  void constructor_withNegativeMaxRetries_usesDefault() {
    AuditConsumerProperties properties =
        new AuditConsumerProperties(
            "stream", "group", "consumer", 100, Duration.ofMillis(100), -1, Duration.ofSeconds(1));

    assertThat(properties.maxRetries()).isEqualTo(3);
  }
}
