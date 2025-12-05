package org.example.platform.audit;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for audit event publishing.
 *
 * @param enabled Whether audit publishing is enabled
 * @param streamKey Redis stream key for audit events
 * @param publishTimeout Maximum time to wait for publish acknowledgment
 */
@ConfigurationProperties(prefix = "audit")
public record AuditProperties(boolean enabled, String streamKey, Duration publishTimeout) {

  /** Default constructor with sensible defaults. */
  public AuditProperties() {
    this(false, "audit-events", Duration.ofMillis(500));
  }

  /**
   * Constructor for property binding with defaults for null values.
   *
   * @param enabled Whether audit is enabled (defaults to false)
   * @param streamKey Redis stream key (defaults to "audit-events")
   * @param publishTimeout Timeout duration (defaults to 500ms)
   */
  public AuditProperties {
    if (streamKey == null) {
      streamKey = "audit-events";
    }
    if (publishTimeout == null) {
      publishTimeout = Duration.ofMillis(500);
    }
  }
}
