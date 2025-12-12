package org.example.platform.events;

import java.time.Duration;
import java.util.UUID;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configuration properties for event stream publishing and consuming. */
@ConfigurationProperties(prefix = "platform.events")
public class EventStreamProperties {

  private String streamKey = "events:default";
  private String consumerGroup = "default-group";
  private String consumerName = "consumer-" + UUID.randomUUID().toString().substring(0, 8);
  private int batchSize = 10;
  private Duration pollInterval = Duration.ofMillis(100);
  private Duration publishTimeout = Duration.ofSeconds(5);
  private int maxRetries = 3;
  private Duration retryDelay = Duration.ofSeconds(1);
  private String deadLetterStreamSuffix = ":dlq";

  public String getStreamKey() {
    return streamKey;
  }

  public void setStreamKey(String streamKey) {
    this.streamKey = streamKey;
  }

  public String getConsumerGroup() {
    return consumerGroup;
  }

  public void setConsumerGroup(String consumerGroup) {
    this.consumerGroup = consumerGroup;
  }

  public String getConsumerName() {
    return consumerName;
  }

  public void setConsumerName(String consumerName) {
    this.consumerName = consumerName;
  }

  public int getBatchSize() {
    return batchSize;
  }

  public void setBatchSize(int batchSize) {
    this.batchSize = batchSize;
  }

  public Duration getPollInterval() {
    return pollInterval;
  }

  public void setPollInterval(Duration pollInterval) {
    this.pollInterval = pollInterval;
  }

  public Duration getPublishTimeout() {
    return publishTimeout;
  }

  public void setPublishTimeout(Duration publishTimeout) {
    this.publishTimeout = publishTimeout;
  }

  public int getMaxRetries() {
    return maxRetries;
  }

  public void setMaxRetries(int maxRetries) {
    this.maxRetries = maxRetries;
  }

  public Duration getRetryDelay() {
    return retryDelay;
  }

  public void setRetryDelay(Duration retryDelay) {
    this.retryDelay = retryDelay;
  }

  public String getDeadLetterStreamSuffix() {
    return deadLetterStreamSuffix;
  }

  public void setDeadLetterStreamSuffix(String deadLetterStreamSuffix) {
    this.deadLetterStreamSuffix = deadLetterStreamSuffix;
  }

  public String getDeadLetterStreamKey() {
    return streamKey + deadLetterStreamSuffix;
  }
}
