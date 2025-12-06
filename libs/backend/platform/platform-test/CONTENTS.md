# Platform Test Contents

## Main Source (src/main/java/org/example/platform/test/)

| File | Description |
|------|-------------|
| `ReactorTestSupport.java` | StepVerifier helpers for testing reactive streams |
| `RedisTestSupport.java` | Testcontainer factory for Redis integration tests |
| `WireMockSupport.java` | WireMock server factory for HTTP mocking |
| `SecurityTestUtils.java` | Helper methods for creating test JWT tokens |
| `TestJwtBuilder.java` | Builder for generating test JWT tokens with custom claims |
| `TestSecurityConfig.java` | Spring security test configuration using test key pair |
| `architecture/ArchitectureRules.java` | Shared ArchUnit rules for layered architecture |

## Resources (src/main/resources/)
None - pure Java library

## Test Source
None - this library provides test utilities

## Key Dependencies

| Dependency | Purpose |
|------------|---------|
| spring-boot-starter-test | Spring test framework |
| reactor-test | Reactor StepVerifier |
| testcontainers | Container management for integration tests |
| wiremock-standalone | HTTP mocking without external process |
| archunit-junit5 | Architecture testing framework |
| jjwt | JWT token generation and parsing |
