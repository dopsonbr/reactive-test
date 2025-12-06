# Platform Test

Shared test utilities for integration testing with Testcontainers, WireMock, and Reactor.

## Features

- Redis Testcontainer support
- WireMock HTTP mocking utilities
- Reactor StepVerifier helpers
- JWT generation for security tests
- Test security configuration
- ArchUnit shared architecture rules

## Usage

### Add Dependency

```kotlin
testImplementation(project(":libs:platform:platform-test"))
```

### Redis Testing

```java
@SpringBootTest
@Testcontainers
class IntegrationTest {

    @Container
    static GenericContainer<?> redis = RedisTestSupport.createRedisContainer();

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port",
            () -> RedisTestSupport.getRedisPort(redis));
    }
}
```

### WireMock Testing

```java
@SpringBootTest
class IntegrationTest {

    @RegisterExtension
    static WireMockExtension wiremock = WireMockExtension.newInstance()
        .options(wireMockConfig().port(8082))
        .build();

    @Test
    void test() {
        wiremock.stubFor(get(urlPathEqualTo("/api/resource"))
            .willReturn(okJson("{\"data\":\"value\"}")));

        // Test code...
    }
}
```

### WireMock Helpers

```java
// Setup success stub
WireMockSupport.stubSuccess(wiremock, "/api/resource", response);

// Setup error stub
WireMockSupport.stubError(wiremock, "/api/resource", 503);

// Verify call was made
WireMockSupport.verifyCalledOnce(wiremock, "/api/resource");
```

### Reactor Testing

```java
@Test
void testMono() {
    Mono<String> mono = service.process();

    StepVerifier.create(mono)
        .expectNext("expected")
        .verifyComplete();
}
```

### JWT Generation

```java
String token = TestJwtBuilder.builder()
    .subject("user-123")
    .issuer("http://auth-server")
    .audience("my-api")
    .claim("roles", List.of("ROLE_USER"))
    .expiresIn(Duration.ofHours(1))
    .build();
```

### Test Security Config

```java
@SpringBootTest
@Import(TestSecurityConfig.class)
class SecurityTest {
    // Security is permissive in tests
}
```

### Architecture Tests

```java
@AnalyzeClasses(
    packages = "org.example.myapp",
    importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest extends ArchitectureRules {
    // Inherits all architecture rules
}
```

## Classes

| Class | Purpose |
|-------|---------|
| `RedisTestSupport` | Redis Testcontainer helpers |
| `WireMockSupport` | WireMock stub helpers |
| `ReactorTestSupport` | StepVerifier utilities |
| `TestJwtBuilder` | JWT token generation |
| `TestSecurityConfig` | Permissive security for tests |
| `SecurityTestUtils` | Security test utilities |
| `ArchitectureRules` | Shared ArchUnit rules |

## Architecture Rules

The shared `ArchitectureRules` enforces:

- **Layered architecture**: Controller → Service → Repository → Domain
- **Controller annotations**: Must use `@RestController`
- **Service annotations**: Must use `@Service`
- **Repository annotations**: Must use `@Repository` or `@Component`
- **Domain purity**: No Spring annotations on domain classes
- **No controller dependencies**: Nothing should depend on controllers

## Dependencies

| Dependency | Purpose |
|------------|---------|
| spring-boot-starter-test | Spring test framework |
| reactor-test | Reactor StepVerifier |
| testcontainers | Container management |
| wiremock-standalone | HTTP mocking |
| archunit-junit5 | Architecture testing |
| jjwt | JWT generation |
