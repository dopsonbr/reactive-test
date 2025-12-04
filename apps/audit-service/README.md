# Audit Service

Event tracking and storage service for capturing audit events from across the platform.

## Features

- **Message Queue Consumer**: Primary ingestion via Redis Streams
- **REST API**: Query and direct event submission endpoints
- **PostgreSQL Storage**: Reactive R2DBC persistence with JSONB support
- **Resilience**: Retry logic, dead letter queue, circuit breakers
- **Structured Logging**: JSON logs with trace correlation

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  cart-service   │     │ other-services  │
└────────┬────────┘     └────────┬────────┘
         │ publish               │ publish
         ▼                       ▼
┌─────────────────────────────────────────┐
│      Redis Streams (audit-events)       │
└─────────────────┬───────────────────────┘
                  │ consume
                  ▼
┌─────────────────────────────────────────┐
│            audit-service                │
│  ┌────────────────┐  ┌──────────────┐   │
│  │ Queue Consumer │  │  REST API    │   │
│  └───────┬────────┘  └──────┬───────┘   │
│          └──────┬───────────┘           │
│                 ▼                       │
│        ┌────────────────┐               │
│        │ AuditRepository│               │
│        └───────┬────────┘               │
└────────────────┼────────────────────────┘
                 ▼
         ┌──────────────┐
         │  PostgreSQL  │
         └──────────────┘
```

## API Endpoints

### Create Audit Event (Secondary)

```http
POST /audit/events
```

**Note:** Primary ingestion is via Redis Streams. This endpoint is for testing/convenience.

**Request Body:**
```json
{
  "eventId": "uuid",
  "eventType": "CART_CREATED",
  "entityType": "CART",
  "entityId": "cart-123",
  "storeNumber": 100,
  "userId": "user01",
  "sessionId": "session-uuid",
  "traceId": "trace-uuid",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {"items": 3}
}
```

**Response (201 Created):** Returns the saved event.

### Get Event by ID

```http
GET /audit/events/{eventId}
```

**Response (200 OK):**
```json
{
  "eventId": "uuid",
  "eventType": "CART_CREATED",
  "entityType": "CART",
  "entityId": "cart-123",
  "storeNumber": 100,
  "userId": "user01",
  "sessionId": "session-uuid",
  "traceId": "trace-uuid",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {"items": 3}
}
```

### Get Events for Entity

```http
GET /audit/entities/{entityType}/{entityId}/events
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startTime | ISO DateTime | No | Start of time range (inclusive) |
| endTime | ISO DateTime | No | End of time range (exclusive) |
| eventType | String | No | Filter by event type |
| limit | Integer | No | Max results (default 100, max 1000) |

### Get Events for User

```http
GET /audit/users/{userId}/events
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startTime | ISO DateTime | No | Start of time range |
| endTime | ISO DateTime | No | End of time range |
| limit | Integer | No | Max results (default 100) |

### Get Events for Store

```http
GET /audit/stores/{storeNumber}/events
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| entityType | String | **Yes** | Entity type filter |
| startTime | ISO DateTime | No | Start of time range |
| endTime | ISO DateTime | No | End of time range |
| eventType | String | No | Filter by event type |
| limit | Integer | No | Max results (default 100) |

## Event Types

| Event Type | Entity Type | Description |
|------------|-------------|-------------|
| CART_CREATED | CART | Cart was created |
| CART_DELETED | CART | Cart was deleted |
| PRODUCT_ADDED | CART | Product added to cart |
| PRODUCT_UPDATED | CART | Product quantity updated |
| PRODUCT_REMOVED | CART | Product removed from cart |
| CUSTOMER_SET | CART | Customer assigned to cart |
| PRODUCT_VIEWED | PRODUCT | Product was viewed |

## Configuration

```yaml
spring:
  r2dbc:
    url: r2dbc:postgresql://localhost:5432/audit
    username: audit
    password: audit

  data:
    redis:
      host: localhost
      port: 6379

audit:
  consumer:
    stream-key: audit-events
    consumer-group: audit-service
    batch-size: 100
    poll-interval: 100ms
    max-retries: 3
    retry-delay: 1s

server:
  port: 8086
```

## Running

### Local Development

```bash
# Start PostgreSQL and Redis
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_USER=audit -e POSTGRES_PASSWORD=audit -e POSTGRES_DB=audit \
  postgres:16-alpine

docker run -d --name redis -p 6379:6379 redis:7-alpine

# Initialize schema
psql -h localhost -U audit -d audit -f apps/audit-service/src/main/resources/schema.sql

# Run with Gradle
./gradlew :apps:audit-service:bootRun
```

### Docker

```bash
# Build JAR
./gradlew :apps:audit-service:bootJar

# Start with Docker Compose
cd docker && docker compose up -d postgres redis audit-service
```

## Testing

```bash
# Run all tests
./gradlew :apps:audit-service:test

# Run specific test class
./gradlew :apps:audit-service:test --tests '*AuditServiceTest*'
```

## Observability

### Metrics

```http
GET /actuator/prometheus
```

Key metrics:
- `audit_events_received_total` - Events received from queue
- `audit_events_processed_total` - Events successfully processed
- `audit_events_failed_total` - Events that failed processing

### Health

```http
GET /actuator/health
```

## Package Structure

```
org.example.audit/
├── AuditServiceApplication.java
├── config/
│   ├── R2dbcConfig.java
│   └── AuditConsumerProperties.java
├── consumer/
│   ├── AuditEventConsumer.java
│   └── DeadLetterHandler.java
├── controller/
│   └── AuditController.java
├── domain/
│   ├── AuditRecord.java
│   └── TimeRange.java
├── repository/
│   ├── AuditRepository.java
│   └── R2dbcAuditRepository.java
└── service/
    └── AuditService.java
```

## Database Schema

```sql
CREATE TABLE audit_events (
    event_id VARCHAR(36) PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    store_number INTEGER NOT NULL,
    user_id VARCHAR(50),
    session_id VARCHAR(36),
    trace_id VARCHAR(36),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data JSONB NOT NULL DEFAULT '{}'
);
```

### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| idx_audit_store_entity_time | store_number, entity_type, created_at | Store queries |
| idx_audit_entity | entity_type, entity_id, created_at | Entity lookups |
| idx_audit_user | user_id, created_at | User activity |
| idx_audit_event_type | event_type, created_at | Event type filtering |
| idx_audit_data_gin | data (GIN) | JSONB queries |

## Dead Letter Queue

Failed events are moved to `audit-events-dlq` Redis stream with:
- Original event payload
- Error message and type
- Failure timestamp

Monitor DLQ for persistent failures requiring manual intervention.

## Related Services

- **platform-audit** - Shared library for publishing audit events
- **cart-service** - Publishes cart-related audit events
