package org.example.platform.events;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class EventStreamPropertiesTest {

  @Test
  void shouldHaveDefaultValues() {
    EventStreamProperties props = new EventStreamProperties();

    assertThat(props.getStreamKey()).isEqualTo("events:default");
    assertThat(props.getConsumerGroup()).isEqualTo("default-group");
    assertThat(props.getConsumerName()).isNotEmpty();
    assertThat(props.getBatchSize()).isEqualTo(10);
    assertThat(props.getPollInterval()).isEqualTo(Duration.ofMillis(100));
    assertThat(props.getPublishTimeout()).isEqualTo(Duration.ofSeconds(5));
    assertThat(props.getMaxRetries()).isEqualTo(3);
    assertThat(props.getRetryDelay()).isEqualTo(Duration.ofSeconds(1));
  }

  @Test
  void shouldAllowCustomConfiguration() {
    EventStreamProperties props = new EventStreamProperties();
    props.setStreamKey("orders:completed");
    props.setConsumerGroup("order-service-group");
    props.setBatchSize(20);

    assertThat(props.getStreamKey()).isEqualTo("orders:completed");
    assertThat(props.getConsumerGroup()).isEqualTo("order-service-group");
    assertThat(props.getBatchSize()).isEqualTo(20);
  }
}
