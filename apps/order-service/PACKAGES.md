# Order Service Package Index

This document indexes all Java packages in the order-service application.

## Package Overview

| Package | Purpose |
|---------|---------|
| [org.example.order](src/main/java/org/example/order/) | Application entry point and Spring Boot bootstrap |
| [org.example.order.config](src/main/java/org/example/order/config/) | R2DBC, Flyway, and custom JSONB converters |
| [org.example.order.consumer](src/main/java/org/example/order/consumer/) | Redis Streams event consumer for OrderCompleted events |
| [org.example.order.controller](src/main/java/org/example/order/controller/) | REST API endpoints for order operations |
| [org.example.order.dto](src/main/java/org/example/order/dto/) | Data Transfer Objects for REST API |
| [org.example.order.graphql](src/main/java/org/example/order/graphql/) | GraphQL query and mutation controllers |
| [org.example.order.graphql.input](src/main/java/org/example/order/graphql/input/) | GraphQL input types mapped from schema |
| [org.example.order.repository](src/main/java/org/example/order/repository/) | Reactive R2DBC data access layer |
| [org.example.order.service](src/main/java/org/example/order/service/) | Business logic and state machine enforcement |
| [org.example.order.validation](src/main/java/org/example/order/validation/) | REST request validation |

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │     controller      │  │          graphql            │   │
│  │   (REST endpoints)  │  │  (Query/Mutation resolvers) │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
│            │                          │                      │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │     validation      │  │      graphql.input          │   │
│  │  (REST validation)  │  │   (GraphQL input types)     │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                      service                         │    │
│  │        (Business logic, state machine)               │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    repository                        │    │
│  │         (R2DBC, JSONB handling, entities)           │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Domain Layer                              │
│  ┌──────────────────────┐  ┌────────────────────────┐       │
│  │        model         │  │          dto           │       │
│  │  (Domain aggregates) │  │  (Transfer objects)    │       │
│  └──────────────────────┘  └────────────────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                  Configuration Layer                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                      config                          │    │
│  │             (R2DBC converters, beans)                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Key Patterns

### Reactive Programming
All layers use Project Reactor types (`Mono<T>`, `Flux<T>`) for non-blocking operations.

### Dual API Surface
- **REST**: `/api/orders/**` endpoints via `controller` package
- **GraphQL**: `/graphql` endpoint via `graphql` package

### OAuth2 Security
Both APIs require OAuth2 scopes:
- `order:read` - Read operations
- `order:write` - Write operations

### Non-Fail-Fast Validation
Both `validation` and `graphql.input` packages collect all errors before returning.

### Own Database + Event Consumption
This service owns its own `orderdb.orders` table and consumes `OrderCompleted` events from checkout-service via Redis Streams.

## Documentation Files

Each package contains:
- `README.md` - Purpose, behavior, and quirks
- `CONTENTS.md` - File listing with descriptions
- `AGENTS.md` - AI agent operational guidance
