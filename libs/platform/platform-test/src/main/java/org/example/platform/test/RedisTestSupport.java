package org.example.platform.test;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;

/** Support class for Redis integration tests using Testcontainers. */
public final class RedisTestSupport {

    private static final String REDIS_IMAGE = "redis:7-alpine";
    private static final int REDIS_PORT = 6379;

    private RedisTestSupport() {}

    /**
     * Create a Redis container for testing.
     *
     * @return configured Redis container
     */
    @SuppressWarnings("resource")
    public static GenericContainer<?> createRedisContainer() {
        return new GenericContainer<>(DockerImageName.parse(REDIS_IMAGE))
                .withExposedPorts(REDIS_PORT);
    }

    /**
     * Get the mapped Redis port from a container.
     *
     * @param container the Redis container
     * @return the mapped port on the host
     */
    public static int getRedisPort(GenericContainer<?> container) {
        return container.getMappedPort(REDIS_PORT);
    }

    /**
     * Get the Redis connection URL from a container.
     *
     * @param container the Redis container
     * @return Redis connection URL (redis://host:port)
     */
    public static String getRedisUrl(GenericContainer<?> container) {
        return String.format("redis://%s:%d", container.getHost(), getRedisPort(container));
    }
}
