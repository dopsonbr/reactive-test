# Platform Test Agent Guidelines

This library provides shared test utilities for all platform applications. Changes here impact all downstream test suites.

## Key Files

| File | Purpose |
|------|---------|
| `ReactorTestSupport.java` | Convenience methods wrapping StepVerifier |
| `RedisTestSupport.java` | Creates Redis containers for @SpringBootTest |
| `WireMockSupport.java` | Creates WireMock servers for HTTP mocking |
| `TestJwtBuilder.java` | Generates signed JWT tokens for security tests |
| `TestSecurityConfig.java` | Provides ReactiveJwtDecoder using test key pair |
| `SecurityTestUtils.java` | Shortcuts for common token scenarios |
| `ArchitectureRules.java` | Base class for architecture tests |

## Common Tasks

### Add a New Test Utility

1. Create utility class in `org.example.platform.test` package
2. Make class `final` with private constructor if static-only
3. Follow existing naming: `{Feature}TestSupport` or `{Feature}TestUtils`
4. Add usage example in README.md
5. Update CONTENTS.md with one-line description

### Add a New Architecture Rule

1. Add `@ArchTest` rule in `ArchitectureRules.java`:
   ```java
   @ArchTest
   static final ArchRule newRule =
       classes()
           .that().haveNameMatching(".*Service")
           .should().beAnnotatedWith(Service.class);
   ```
2. Document rule in README.md under "Architecture Rules"
3. Verify rule against existing applications

### Modify Test Key Pair

The RSA key pair in `TestJwtBuilder.generateKeyPair()` is shared across all tests. Changing it invalidates all existing test tokens. Only modify if:
- Security requirements change
- Key algorithm needs upgrade
- Coordinated update across all services

### Add WireMock Helper Method

Add static method to `WireMockSupport` following pattern:
```java
public static void stubNewPattern(WireMockServer server, String path, Object response) {
    server.stubFor(
        // stub configuration
    );
}
```

## Patterns in This Library

### Testcontainer Factories

All container factories return `GenericContainer<?>` with:
- Alpine-based images for fast startup
- Exposed ports configured
- No auto-start (managed by JUnit/Testcontainers lifecycle)

### JWT Token Generation

`TestJwtBuilder` uses builder pattern with sensible defaults:
- Default issuer: `test-issuer`
- Default subject: `test-user`
- Default audience: `reactive-test-api`
- Default expiration: 1 hour from now
- Default scope: `product:read`

### Architecture Rules

`ArchitectureRules` is abstract base class. Applications extend it and add `@AnalyzeClasses` annotation to scope.

## Boundaries

Files requiring careful review before changes:
- `TestJwtBuilder.java` - Key pair generation impacts all security tests
- `ArchitectureRules.java` - Rules enforce architecture across all services

## Conventions

- All utility classes are `final` with private constructors
- Factory methods return configured but not started instances
- Test configs use `@TestConfiguration` not `@Configuration`
- All public methods have JavaDoc
- No test files in this module (utilities only)

## Warnings

- Changing `TestJwtBuilder` key pair breaks all existing security tests
- Adding strict ArchUnit rules may break existing applications
- Redis container uses port 6379 internally (mapped to random host port)
- WireMock stubbing is not thread-safe across parallel tests
