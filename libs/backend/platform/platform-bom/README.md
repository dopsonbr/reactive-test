# Platform BOM

Bill of Materials (BOM) providing centralized dependency version management for the platform.

## Purpose

- Extends Spring Boot BOM as the foundation
- Adds versions for non-Spring dependencies (Resilience4j, Testcontainers, etc.)
- Ensures consistent versions across all applications and libraries

## Usage

### In Applications

```kotlin
plugins {
    id("platform.application-conventions")
}

dependencies {
    implementation(platform(project(":libs:platform:platform-bom")))
    // Now versions are managed by the BOM
    implementation("io.github.resilience4j:resilience4j-spring-boot")
}
```

### In Libraries

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:platform:platform-bom")))
}
```

## Managed Dependencies

### From Spring Boot BOM (inherited)

- Spring Framework
- Spring Data
- Spring Security
- Jackson
- Micrometer
- Project Reactor
- Lettuce (Redis)
- And many more...

### Platform-Specific Constraints

| Dependency | Version | Purpose |
|------------|---------|---------|
| Resilience4j | 2.2.0 | Circuit breaker, retry, timeout, bulkhead |
| Logstash Logback Encoder | 8.0 | JSON log formatting |
| OpenTelemetry API | 1.44.1 | Tracing API |
| Testcontainers | 1.20.4 | Integration testing |
| WireMock | 3.10.0 | HTTP mocking |
| JJWT | 0.12.6 | JWT generation for tests |
| ArchUnit | 1.3.0 | Architecture testing |

## Adding New Dependencies

1. Add version to `gradle/libs.versions.toml`:
   ```toml
   [versions]
   new-dep = "1.0.0"

   [libraries]
   new-dep = { module = "com.example:new-dep", version.ref = "new-dep" }
   ```

2. Add constraint to `platform-bom/build.gradle.kts`:
   ```kotlin
   constraints {
       api(libs.new.dep)
   }
   ```

3. Use in dependent modules without specifying version:
   ```kotlin
   implementation(libs.new.dep)
   ```

## File Structure

```
platform-bom/
└── build.gradle.kts    # BOM definition with constraints
```
