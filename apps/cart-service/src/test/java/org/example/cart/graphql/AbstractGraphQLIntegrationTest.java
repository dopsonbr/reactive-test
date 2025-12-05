package org.example.cart.graphql;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Lazy;
import org.springframework.graphql.test.tester.HttpGraphQlTester;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Base class for GraphQL integration tests. Configures PostgreSQL and Redis containers for full
 * integration testing.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@Import(AbstractGraphQLIntegrationTest.GraphQlTesterConfiguration.class)
public abstract class AbstractGraphQLIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:15-alpine")
                    .withDatabaseName("cartdb")
                    .withUsername("cart_user")
                    .withPassword("cart_pass");

    @Container
    static GenericContainer<?> redis =
            new GenericContainer<>(DockerImageName.parse("redis:7-alpine")).withExposedPorts(6379);

    @Autowired protected HttpGraphQlTester graphQlTester;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // R2DBC configuration
        registry.add(
                "spring.r2dbc.url",
                () ->
                        String.format(
                                "r2dbc:postgresql://%s:%d/%s",
                                postgres.getHost(),
                                postgres.getFirstMappedPort(),
                                postgres.getDatabaseName()));
        registry.add("spring.r2dbc.username", postgres::getUsername);
        registry.add("spring.r2dbc.password", postgres::getPassword);

        // JDBC DataSource for Flyway (required since app uses R2DBC)
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);

        // Flyway configuration
        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.flyway.locations", () -> "classpath:db/migration");

        // Redis configuration for pub/sub
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);

        // Disable audit for tests
        registry.add("audit.enabled", () -> false);

        // Disable security for tests (method-level still works with @WithMockUser)
        registry.add("app.security.enabled", () -> false);
    }

    @TestConfiguration
    static class GraphQlTesterConfiguration {
        @Bean
        @Lazy
        HttpGraphQlTester httpGraphQlTester(@Value("${local.server.port}") int port) {
            WebTestClient webTestClient =
                    WebTestClient.bindToServer()
                            .baseUrl("http://localhost:" + port + "/graphql")
                            .build();
            return HttpGraphQlTester.create(webTestClient);
        }
    }
}
