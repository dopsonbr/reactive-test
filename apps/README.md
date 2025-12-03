# Applications

This directory contains Spring Boot WebFlux applications that demonstrate reactive platform patterns.

## Applications

| Application | Port | Description |
|-------------|------|-------------|
| [product-service](product-service/) | 8080 | Product aggregation from merchandise, price, and inventory services |
| [cart-service](cart-service/) | 8082 (local) / 8081 (docker) | Shopping cart management with Redis persistence |

## Architecture

All applications follow a consistent layered architecture:

```
org.example.{app}/
├── {App}Application.java      # Spring Boot entry point
├── controller/                # REST endpoints (@RestController)
├── service/                   # Business logic (@Service)
├── repository/                # External service clients
│   └── {external}/           # One package per external service
├── domain/                    # Domain models (records)
├── config/                    # Configuration classes (@Configuration)
├── validation/                # Request validators (@Component)
└── security/                  # Security configuration
```

## Layer Dependencies

```
Controller → Service → Repository
     ↓          ↓          ↓
   Domain    Domain     Domain
```

- Controllers depend on services (never repositories directly)
- Services orchestrate repositories
- Repositories handle external I/O (HTTP, Redis, DB)
- Domain objects have NO dependencies on other layers

## Building

```bash
# Build all applications
./gradlew :apps:product-service:build :apps:cart-service:build

# Build bootable JARs
./gradlew :apps:product-service:bootJar :apps:cart-service:bootJar
```

## Running

```bash
# Run locally
./gradlew :apps:product-service:bootRun
./gradlew :apps:cart-service:bootRun

# Run with Docker Compose (includes observability stack)
cd docker && docker compose up -d
```

## Required Headers

All applications expect these headers for context propagation:

| Header | Format | Example |
|--------|--------|---------|
| x-store-number | Integer 1-2000 | `1234` |
| x-order-number | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| x-userid | 6 alphanumeric | `abc123` |
| x-sessionid | UUID | `550e8400-e29b-41d4-a716-446655440000` |

## Standards

Applications follow platform standards documented in [docs/standards/](../docs/standards/):

- [Architecture](../docs/standards/architecture.md) - Layered architecture
- [Caching](../docs/standards/caching.md) - Cache-aside and fallback patterns
- [Error Handling](../docs/standards/error-handling.md) - Consistent error responses
- [Observability](../docs/standards/observability-logs.md) - Structured logging
- [Resilience](../docs/standards/resiliency-circuit-breakers.md) - Circuit breakers, retries, timeouts
- [Testing](../docs/standards/testing-integration.md) - Integration testing with Testcontainers

## Creating a New Application

1. Create module directory: `apps/new-service/`
2. Create `build.gradle.kts`:
   ```kotlin
   plugins {
       id("platform.application-conventions")
   }

   dependencies {
       implementation(project(":libs:platform:platform-logging"))
       implementation(project(":libs:platform:platform-resilience"))
       implementation(project(":libs:platform:platform-cache"))
       implementation(project(":libs:platform:platform-error"))
       implementation(project(":libs:platform:platform-webflux"))
       implementation(project(":libs:platform:platform-security"))

       testImplementation(project(":libs:platform:platform-test"))
   }
   ```
3. Add to `settings.gradle.kts`: `include("apps:new-service")`
4. Create application class with proper `scanBasePackages`
5. Add to Docker Compose
6. Create README.md, AGENTS.md, CONTENTS.md documentation
