# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
# Build the project
./gradlew build

# Run tests
./gradlew test

# Run a single test class
./gradlew test --tests "org.example.reactivetest.ReactiveTestApplicationTests"

# Run a single test method
./gradlew test --tests "org.example.reactivetest.ReactiveTestApplicationTests.contextLoads"

# Run the application
./gradlew bootRun

# Clean build
./gradlew clean build
```

## Project Overview

Spring Boot 3.5.x WebFlux application (Java 21) for testing logging behavior and reactive context propagation. Validates that request metadata is correctly propagated through reactive chains.

**Key dependencies:**
- Spring WebFlux (reactive web stack)
- Spring Actuator with Prometheus metrics
- Reactor Test for testing reactive streams

## Architecture

```
Controller/
    ProductController       # GET /products/{sku} - validates input, creates Reactor Context

Domain/
    Product                 # { sku, description, price, availableQuantity }

Services/
    ProductService          # Orchestrates parallel calls to repositories

Repository/
    MerchandiseRepository   # GET  /merchandise/{sku} → description
    PriceRepository         # POST /price            → price
    InventoryRepository     # POST /inventory        → availableQuantity
```

Repository calls execute in parallel. External service URLs configured in `application.properties`.

## Request Headers

Metadata propagated via Reactor Context:
- `x-store-number` - Integer 1-2000
- `x-order-number` - UUID
- `x-userid` - 6 alphanumeric chars
- `x-sessionid` - UUID

## Logging

- **Format:** Structured JSON
- **Context propagation:** Reactor Context (not MDC)
- **Inbound filter:** Request/response at controller layer with metadata
- **Outbound filter:** Request/response for external HTTP calls with metadata

## Testing

- **Performance test:** k6 script sending 10k requests
- **Mock server:** WireMock standalone (15-75ms latency)
- **Test script:** Orchestrates WireMock, app startup, k6 execution, and log validation