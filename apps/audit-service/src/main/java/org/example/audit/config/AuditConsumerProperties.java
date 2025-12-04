package org.example.audit.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for the audit event consumer.
 *
 * @param streamKey Redis stream key to consume from
 * @param consumerGroup Consumer group name
 * @param consumerName Consumer name within the group
 * @param batchSize Maximum number of messages to process per batch
 * @param pollInterval Interval between polls when no messages are available
 * @param maxRetries Maximum retry attempts for failed messages
 * @param retryDelay Delay between retry attempts
 */
@ConfigurationProperties(prefix = "audit.consumer")
public record AuditConsumerProperties(
        String streamKey,
        String consumerGroup,
        String consumerName,
        int batchSize,
        Duration pollInterval,
        int maxRetries,
        Duration retryDelay) {

    /** Default constructor with sensible defaults. */
    public AuditConsumerProperties() {
        this(
                "audit-events",
                "audit-service",
                "audit-consumer-1",
                100,
                Duration.ofMillis(100),
                3,
                Duration.ofSeconds(1));
    }

    /** Constructor for property binding with defaults for null values. */
    public AuditConsumerProperties {
        if (streamKey == null) {
            streamKey = "audit-events";
        }
        if (consumerGroup == null) {
            consumerGroup = "audit-service";
        }
        if (consumerName == null) {
            consumerName = "audit-consumer-1";
        }
        if (batchSize <= 0) {
            batchSize = 100;
        }
        if (pollInterval == null) {
            pollInterval = Duration.ofMillis(100);
        }
        if (maxRetries <= 0) {
            maxRetries = 3;
        }
        if (retryDelay == null) {
            retryDelay = Duration.ofSeconds(1);
        }
    }
}
