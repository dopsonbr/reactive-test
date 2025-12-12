package org.example.checkout.config;

import org.example.checkout.event.CheckoutEventProperties;
import org.example.platform.events.CloudEventPublisher;
import org.example.platform.events.CloudEventSerializer;
import org.example.platform.events.RedisStreamEventPublisher;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.ReactiveRedisTemplate;

/** Configuration for event publishing in checkout-service. */
@Configuration
@EnableConfigurationProperties(CheckoutEventProperties.class)
public class EventPublisherConfig {

  @Bean
  public CloudEventPublisher cloudEventPublisher(
      ReactiveRedisTemplate<String, String> redisTemplate,
      CloudEventSerializer serializer,
      CheckoutEventProperties properties) {
    return new RedisStreamEventPublisher(redisTemplate, serializer, properties);
  }
}
