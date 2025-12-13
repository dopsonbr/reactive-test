package org.example.platform.audit;

import java.net.URI;
import org.example.platform.events.CloudEventSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.ReactiveRedisTemplate;

/** Auto-configuration for audit event publishing using CloudEvents format. */
@AutoConfiguration
@EnableConfigurationProperties(AuditProperties.class)
public class AuditAutoConfiguration {

  /**
   * Creates the Redis Stream audit publisher when audit is enabled and Redis is available.
   *
   * @param redisTemplate The reactive Redis template
   * @param cloudEventSerializer CloudEvents serializer
   * @param properties Audit configuration properties
   * @param applicationName Application name for CloudEvent source URI
   * @return RedisStreamAuditPublisher instance
   */
  @Bean
  @ConditionalOnProperty(name = "audit.enabled", havingValue = "true")
  @ConditionalOnBean(ReactiveRedisTemplate.class)
  public AuditEventPublisher redisStreamAuditPublisher(
      ReactiveRedisTemplate<String, String> redisTemplate,
      CloudEventSerializer cloudEventSerializer,
      AuditProperties properties,
      @Value("${spring.application.name:unknown}") String applicationName) {
    URI source = URI.create("/" + applicationName);
    return new RedisStreamAuditPublisher(redisTemplate, cloudEventSerializer, properties, source);
  }

  /**
   * Creates a no-op audit publisher when audit is disabled.
   *
   * @return NoOpAuditPublisher instance
   */
  @Bean
  @ConditionalOnMissingBean(AuditEventPublisher.class)
  public AuditEventPublisher noOpAuditPublisher() {
    return new NoOpAuditPublisher();
  }
}
