package org.example.platform.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.ReactiveRedisTemplate;

/** Auto-configuration for platform-events. */
@AutoConfiguration
@ConditionalOnClass(ReactiveRedisTemplate.class)
@EnableConfigurationProperties(EventStreamProperties.class)
public class EventsAutoConfiguration {

  @Bean
  @ConditionalOnMissingBean
  public CloudEventSerializer cloudEventSerializer(ObjectMapper objectMapper) {
    return new CloudEventSerializer(objectMapper);
  }
}
