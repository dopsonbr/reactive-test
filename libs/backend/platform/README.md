# Platform Libraries

Shared libraries providing cross-cutting concerns for reactive Spring Boot applications.

## Libraries

| Library | Purpose |
|---------|---------|
| [platform-bom](platform-bom/) | Bill of Materials - centralized dependency versions |
| [platform-logging](platform-logging/) | Structured JSON logging with Reactor Context |
| [platform-resilience](platform-resilience/) | Resilience4j reactive wrappers |
| [platform-cache](platform-cache/) | Non-blocking Redis cache abstraction |
| [platform-error](platform-error/) | Global error handling with consistent responses |
| [platform-webflux](platform-webflux/) | Common WebFlux utilities (context, validation) |
| [platform-security](platform-security/) | OAuth2/JWT validation configuration |
| [platform-test](platform-test/) | Shared test utilities (WireMock, Redis, Reactor) |

## Architecture

```
                    Applications
                         │
    ┌────────────────────┼────────────────────┐
    ▼                    ▼                    ▼
platform-logging    platform-cache    platform-resilience
        │                │                    │
        └────────────────┼────────────────────┘
                         │
                    platform-bom
                         │
                 Spring Boot BOM
```

## Usage

### In Application build.gradle.kts

```kotlin
plugins {
    id("platform.application-conventions")
}

dependencies {
    // Import platform BOM for version management
    implementation(platform(project(":libs:backend:platform:platform-bom")))

    // Add platform libraries as needed
    implementation(project(":libs:backend:platform:platform-logging"))
    implementation(project(":libs:backend:platform:platform-resilience"))
    implementation(project(":libs:backend:platform:platform-cache"))
    implementation(project(":libs:backend:platform:platform-error"))
    implementation(project(":libs:backend:platform:platform-webflux"))
    implementation(project(":libs:backend:platform:platform-security"))

    // Test utilities
    testImplementation(project(":libs:backend:platform:platform-test"))
}
```

### In Library build.gradle.kts

```kotlin
plugins {
    id("platform.library-conventions")
}

dependencies {
    // Reference BOM
    api(platform(project(":libs:backend:platform:platform-bom")))

    // Add dependencies...
}
```

## Key Patterns

### Reactor Context (Not MDC)

All libraries use Reactor Context for request metadata propagation:

```java
Mono.deferContextual(ctx -> {
    RequestMetadata metadata = ctx.get(ContextKeys.METADATA);
    // Use metadata...
})
.contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
```

### Structured Logging

```java
@Autowired
private StructuredLogger structuredLogger;

Mono.deferContextual(ctx -> {
    structuredLogger.logMessage(ctx, "componentname", "Message");
    return ...
});
```

### Resilience Decorators

```java
@Autowired
private ReactiveResilience resilience;

resilience.decorate("service-name", webClient.get()...);
// Applies: timeout → circuit breaker → retry → bulkhead
```

### Caching

```java
@Autowired
private ReactiveCacheService cache;

cache.get("key", Type.class)
    .switchIfEmpty(fetchFromService().doOnNext(v -> cache.put("key", v, ttl)));
```

## Building

```bash
# Build all platform libraries
./gradlew :libs:backend:platform:platform-bom:build
./gradlew :libs:backend:platform:platform-logging:build
./gradlew :libs:backend:platform:platform-resilience:build
./gradlew :libs:backend:platform:platform-cache:build
./gradlew :libs:backend:platform:platform-error:build
./gradlew :libs:backend:platform:platform-webflux:build
./gradlew :libs:backend:platform:platform-security:build
./gradlew :libs:backend:platform:platform-test:build
```

## Creating a New Platform Library

1. Create directory: `libs/backend/platform/platform-new/`
2. Create `build.gradle.kts`:
   ```kotlin
   plugins {
       id("platform.library-conventions")
   }

   dependencies {
       api(platform(project(":libs:backend:platform:platform-bom")))
       // Add dependencies...
   }
   ```
3. Add to `settings.gradle.kts`: `include("libs:backend:platform:platform-new")`
4. Create package: `org.example.platform.{new}/`
5. Add README.md, AGENTS.md, CONTENTS.md
