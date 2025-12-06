# Order Service Package Index

This document indexes all Java packages in the order-service application.

## Package Overview

| Package | Purpose |
|---------|---------|
| [org.example.order](src/main/java/org/example/order/) | Application entry point and Spring Boot bootstrap |
| [org.example.order.config](src/main/java/org/example/order/config/) | R2DBC configuration and custom JSONB converters |
| [org.example.order.controller](src/main/java/org/example/order/controller/) | REST API endpoints for order operations |
| [org.example.order.dto](src/main/java/org/example/order/dto/) | Data Transfer Objects for REST API |
| [org.example.order.graphql](src/main/java/org/example/order/graphql/) | GraphQL query and mutation controllers |
| [org.example.order.graphql.input](src/main/java/org/example/order/graphql/input/) | GraphQL input types mapped from schema |
| [org.example.order.model](src/main/java/org/example/order/model/) | Domain models (Order aggregate, enums, value objects) |
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

### Shared Database
This service shares the `checkoutdb.orders` table with checkout-service (read-only access).

## Documentation Files

Each package contains:
- `README.md` - Purpose, behavior, and quirks
- `CONTENTS.md` - File listing with descriptions
- `AGENTS.md` - AI agent operational guidance
