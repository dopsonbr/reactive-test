# Inventory Service

Stock and inventory management service providing real-time availability data for the merchant portal and product aggregation.

## Features

- **Inventory Management**: Track stock levels by SKU with reactive PostgreSQL persistence
- **Low Stock Alerts**: Query items below threshold for merchant portal notifications
- **Service Integration**: Provides availability data to product-service for aggregation
- **Reactive R2DBC**: Non-blocking database access with Spring Data R2DBC
- **Flyway Migrations**: Schema versioning with blocking DataSource for migrations
- **Structured Logging**: JSON logs with platform-logging integration
- **Role-Based Access**: Update operations require INVENTORY_SPECIALIST role (planned)

## API Endpoints

### Get Inventory by SKU

```http
GET /inventory/{sku}
```

**Description:** Retrieve stock availability for a specific SKU. Used by product-service for service-to-service calls.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| sku | Long | Product SKU identifier |

**Response:**
```json
{
  "availableQuantity": 100
}
```

**Status Codes:**
- `200 OK` - Stock record found
- `404 Not Found` - SKU not in inventory

---

### List All Inventory

```http
GET /inventory?page={page}&size={size}
```

**Description:** Paginated list of all inventory records. Used by merchant portal for inventory dashboard.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 0 | Page number (zero-indexed) |
| size | int | 20 | Page size |

**Response:**
```json
[
  {
    "sku": 123456,
    "availableQuantity": 100,
    "updatedAt": "2025-12-10T10:30:00Z"
  },
  {
    "sku": 789012,
    "availableQuantity": 45,
    "updatedAt": "2025-12-10T09:15:00Z"
  }
]
```

---

### Get Low Stock Items

```http
GET /inventory/low-stock?threshold={threshold}
```

**Description:** Retrieve items with availability below threshold. Used by merchant portal for low stock alerts.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| threshold | int | 10 | Quantity threshold for low stock |

**Response:**
```json
[
  {
    "sku": 345678,
    "availableQuantity": 5,
    "updatedAt": "2025-12-10T08:00:00Z"
  },
  {
    "sku": 901234,
    "availableQuantity": 2,
    "updatedAt": "2025-12-10T07:30:00Z"
  }
]
```

---

### Update Inventory

```http
PUT /inventory/{sku}
```

**Description:** Create or update stock quantity for a SKU. Used by merchant portal (requires INVENTORY_SPECIALIST role - security integration planned).

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| sku | Long | Product SKU identifier |

**Request Body:**
```json
{
  "availableQuantity": 150
}
```

**Validation:**
- `availableQuantity` is required
- `availableQuantity` must be >= 0

**Response:**
```json
{
  "sku": 123456,
  "availableQuantity": 150,
  "updatedAt": "2025-12-10T10:45:00Z"
}
```

**Status Codes:**
- `200 OK` - Stock updated successfully
- `400 Bad Request` - Validation failure
- `401 Unauthorized` - Missing or invalid JWT (when security enabled)
- `403 Forbidden` - Missing INVENTORY_SPECIALIST role (when security enabled)

---

### Health Check

```http
GET /actuator/health
```

**Response:**
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": { "status": "UP" },
    "ping": { "status": "UP" }
  }
}
```

## Architecture

```
InventoryController
       ↓
InventoryService
       ↓
StockR2dbcRepository
       ↓
  PostgreSQL (R2DBC)
```

**Key Components:**
- **Controller**: REST endpoints with validation
- **Service**: Business logic for CRUD operations
- **Repository**: R2DBC reactive database access
- **FlywayConfiguration**: Blocking JDBC DataSource for schema migrations

## Configuration

### Database

```yaml
spring:
  r2dbc:
    url: r2dbc:postgresql://localhost:5432/inventorydb
    username: inventory_user
    password: inventory_pass
    pool:
      initial-size: 5
      max-size: 20
      max-idle-time: 30m
```

### Flyway Migrations

```yaml
spring:
  flyway:
    enabled: true
    url: jdbc:postgresql://localhost:5432/inventorydb
    user: inventory_user
    password: inventory_pass
    locations: classpath:db/migration
```

### Security

```yaml
app:
  security:
    enabled: false  # Set to true for OAuth2/JWT validation
```

**Note:** Security is currently disabled for development. Enable for production deployment.

### Port

```yaml
server:
  port: 8093
```

## Database Schema

### Stock Table

```sql
CREATE TABLE stock (
    sku BIGINT PRIMARY KEY,
    available_quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_available ON stock(available_quantity);
CREATE INDEX idx_stock_updated_at ON stock(updated_at);
```

**Indexes:**
- `idx_stock_available` - Supports low-stock queries
- `idx_stock_updated_at` - Supports recently updated queries

## Running

### Local Development

**Prerequisites:**
- PostgreSQL 15+ running on localhost:5432
- Database `inventorydb` created
- User `inventory_user` with password `inventory_pass` and full access to `inventorydb`

```bash
# Create database (if needed)
psql -U postgres -c "CREATE DATABASE inventorydb;"
psql -U postgres -c "CREATE USER inventory_user WITH PASSWORD 'inventory_pass';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE inventorydb TO inventory_user;"

# Run with Nx
pnpm nx run :apps:inventory-service:bootRun

# Or with Gradle
./gradlew :apps:inventory-service:bootRun
```

Service runs on http://localhost:8093

### Docker

```bash
# Build JAR
./gradlew :apps:inventory-service:bootJar

# Start with Docker Compose
cd docker && docker compose up -d inventory-service
```

**Docker Configuration:**
- Uses `application-docker.yml` profile
- Connects to `postgres` service on Docker network
- Exposes port 8093

## Testing

```bash
# Run all tests (when implemented)
pnpm nx test :apps:inventory-service

# Or with Gradle
./gradlew :apps:inventory-service:test
```

**Test Coverage (Planned):**
- Context load test with Testcontainers PostgreSQL
- Integration tests for repository layer
- Controller unit tests with WebTestClient
- Architecture tests with ArchUnit

## Observability

### Metrics (Prometheus)

```http
GET /actuator/prometheus
```

Key metrics:
- `http_server_requests_seconds` - Request latency
- `r2dbc_pool_acquired_connections` - Connection pool usage
- `r2dbc_pool_pending_connections` - Connection pool backlog

### Logs

JSON-structured logs with:
- `level` - Log level (DEBUG, INFO, WARN, ERROR)
- `timestamp` - ISO 8601 timestamp
- `logger` - Logger name (org.example.inventory.*)
- `message` - Log message

### Health

```http
GET /actuator/health
```

Includes:
- Database connectivity check
- R2DBC connection pool status

## Package Structure

```
org.example.inventory/
├── InventoryServiceApplication.java
├── controller/
│   └── InventoryController.java
├── service/
│   └── InventoryService.java
├── repository/
│   ├── StockEntity.java
│   └── StockR2dbcRepository.java
├── dto/
│   ├── InventoryResponse.java
│   └── UpdateInventoryRequest.java
└── config/
    └── FlywayConfiguration.java
```

## Integration with Product Service

Product service calls `GET /inventory/{sku}` during product aggregation:

```java
// product-service repository pattern
inventoryRepo.getInventory(sku, storeNumber)
    .map(response -> response.availableQuantity())
    .onErrorReturn(0);  // Fallback to unavailable
```

## Platform Libraries Used

| Library | Purpose |
|---------|---------|
| platform-logging | Structured JSON logging with StructuredLogger |
| platform-error | GlobalErrorHandler for validation errors |
| platform-webflux | RequestMetadata and ContextKeys for context propagation |
| platform-security | OAuth2/JWT validation (when enabled) |

## Future Enhancements

- OAuth2 security enforcement with INVENTORY_SPECIALIST role check
- Write-ahead logging for inventory changes
- Event publishing for inventory updates (Kafka/RabbitMQ)
- Cache integration for GET operations
- Bulk update endpoint for CSV imports
- Reserved quantity tracking for in-cart items
- Warehouse location tracking
