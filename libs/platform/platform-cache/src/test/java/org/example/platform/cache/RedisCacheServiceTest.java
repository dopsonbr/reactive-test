package org.example.platform.cache;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.LinkedHashMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class RedisCacheServiceTest {

    @Mock private ReactiveRedisTemplate<String, Object> redisTemplate;

    @Mock private ReactiveValueOperations<String, Object> valueOperations;

    private RedisCacheService cacheService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        cacheService = new RedisCacheService(redisTemplate, objectMapper);
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void get_shouldReturnValue_whenCacheHit() {
        // Given
        String key = "test:key";
        TestData expected = new TestData("value1", 42);
        LinkedHashMap<String, Object> cachedValue = new LinkedHashMap<>();
        cachedValue.put("name", "value1");
        cachedValue.put("count", 42);

        when(valueOperations.get(key)).thenReturn(Mono.just(cachedValue));

        // When & Then
        StepVerifier.create(cacheService.get(key, TestData.class))
                .expectNextMatches(
                        result ->
                                result.name().equals(expected.name())
                                        && result.count() == expected.count())
                .verifyComplete();
    }

    @Test
    void get_shouldReturnEmpty_whenCacheMiss() {
        // Given
        String key = "test:missing";
        when(valueOperations.get(key)).thenReturn(Mono.empty());

        // When & Then
        StepVerifier.create(cacheService.get(key, TestData.class)).verifyComplete();
    }

    @Test
    void get_shouldReturnEmpty_whenRedisError() {
        // Given
        String key = "test:error";
        when(valueOperations.get(key))
                .thenReturn(Mono.error(new RuntimeException("Redis connection failed")));

        // When & Then - should not propagate error, just return empty
        StepVerifier.create(cacheService.get(key, TestData.class)).verifyComplete();
    }

    @Test
    void put_shouldReturnTrue_whenSuccess() {
        // Given
        String key = "test:put";
        TestData value = new TestData("test", 100);
        Duration ttl = Duration.ofMinutes(5);

        when(valueOperations.set(eq(key), any(), eq(ttl))).thenReturn(Mono.just(true));

        // When & Then
        StepVerifier.create(cacheService.put(key, value, ttl)).expectNext(true).verifyComplete();
    }

    @Test
    void put_shouldReturnFalse_whenRedisError() {
        // Given
        String key = "test:error";
        TestData value = new TestData("test", 100);
        Duration ttl = Duration.ofMinutes(5);

        when(valueOperations.set(eq(key), any(), eq(ttl)))
                .thenReturn(Mono.error(new RuntimeException("Redis write failed")));

        // When & Then - should not propagate error, just return false
        StepVerifier.create(cacheService.put(key, value, ttl)).expectNext(false).verifyComplete();
    }

    @Test
    void delete_shouldReturnTrue_whenKeyDeleted() {
        // Given
        String key = "test:delete";
        when(redisTemplate.delete(key)).thenReturn(Mono.just(1L));

        // When & Then
        StepVerifier.create(cacheService.delete(key)).expectNext(true).verifyComplete();
    }

    @Test
    void delete_shouldReturnFalse_whenKeyNotFound() {
        // Given
        String key = "test:missing";
        when(redisTemplate.delete(key)).thenReturn(Mono.just(0L));

        // When & Then
        StepVerifier.create(cacheService.delete(key)).expectNext(false).verifyComplete();
    }

    @Test
    void delete_shouldReturnFalse_whenRedisError() {
        // Given
        String key = "test:error";
        when(redisTemplate.delete(key))
                .thenReturn(Mono.error(new RuntimeException("Redis delete failed")));

        // When & Then - should not propagate error, just return false
        StepVerifier.create(cacheService.delete(key)).expectNext(false).verifyComplete();
    }

    // Test record for serialization/deserialization
    record TestData(String name, int count) {}
}
