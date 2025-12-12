package org.example.platform.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.ReactiveRedisTemplate;

/**
 * Auto-configuration for platform-events.
 *
 * <p>Note: This auto-configuration only provides the CloudEventSerializer. Applications must
 * provide their own CloudEventPublisher bean with their specific EventStreamProperties subclass.
 * This is because each application typically has its own event stream configuration.
 */
@AutoConfiguration
@ConditionalOnClass(ReactiveRedisTemplate.class)
public class EventsAutoConfiguration {

  @Bean
  @ConditionalOnMissingBean
  public CloudEventSerializer cloudEventSerializer(ObjectMapper objectMapper) {
    return new CloudEventSerializer(objectMapper);
  }
}
