package org.example.platform.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.ReactiveRedisTemplate;

/** Auto-configuration for audit event publishing. */
@AutoConfiguration
@EnableConfigurationProperties(AuditProperties.class)
public class AuditAutoConfiguration {

    /**
     * Creates an ObjectMapper configured for audit events if one is not already present.
     *
     * @return ObjectMapper with JavaTimeModule and ISO-8601 date formatting
     */
    @Bean
    @ConditionalOnMissingBean(name = "auditObjectMapper")
    public ObjectMapper auditObjectMapper() {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * Creates the Redis Stream audit publisher when audit is enabled and Redis is available.
     *
     * @param redisTemplate The reactive Redis template
     * @param objectMapper ObjectMapper for JSON serialization
     * @param properties Audit configuration properties
     * @return RedisStreamAuditPublisher instance
     */
    @Bean
    @ConditionalOnProperty(name = "audit.enabled", havingValue = "true")
    @ConditionalOnBean(ReactiveRedisTemplate.class)
    public AuditEventPublisher redisStreamAuditPublisher(
            ReactiveRedisTemplate<String, String> redisTemplate,
            ObjectMapper objectMapper,
            AuditProperties properties) {
        return new RedisStreamAuditPublisher(redisTemplate, objectMapper, properties);
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
