package org.example.product;

import org.example.platform.test.RedisTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Application context test to verify the Spring context loads successfully. */
@SpringBootTest
@Testcontainers
class ProductServiceApplicationTest {

    @Container static GenericContainer<?> redis = RedisTestSupport.createRedisContainer();

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> RedisTestSupport.getRedisPort(redis));
    }

    @Test
    void contextLoads() {
        // Verifies that the Spring application context starts successfully
    }
}
