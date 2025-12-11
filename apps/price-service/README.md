# Price Service

Price management service providing current and original pricing data for products.

## Features

- **Price Management**: Get, list, and update product pricing
- **Merchant Portal Integration**: Supports merchant price updates
- **Service-to-Service API**: Provides pricing data to product-service
- **PostgreSQL Storage**: R2DBC reactive database access
- **Flyway Migrations**: Schema version management
- **Structured Logging**: JSON logs with trace correlation
- **Reactive WebFlux**: Non-blocking I/O with Project Reactor

## API Endpoints

### Get Price by SKU

```http
GET /price/{sku}
```

Used by product-service for aggregating product data.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| sku | Long | Product SKU identifier |

**Response:**
```json
{
  "price": 29.99,
  "originalPrice": 39.99,
  "currency": "USD"
}
```

**Status Codes:**
- `200 OK` - Price found
- `404 Not Found` - SKU does not exist

### List All Prices

```http
GET /price?page={page}&size={size}
```

Used by merchant portal to browse all product prices.

**Query Parameters:**
| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| page | No | 0 | Zero-based page number |
| size | No | 20 | Number of items per page |

**Response:**
```json
[
  {
    "sku": 123456,
    "price": 29.99,
    "originalPrice": 39.99,
    "currency": "USD",
    "updatedAt": "2025-12-10T10:30:00Z"
  },
  {
    "sku": 789012,
    "price": 15.50,
    "originalPrice": 15.50,
    "currency": "USD",
    "updatedAt": "2025-12-10T09:15:00Z"
  }
]
```

### Set/Update Price

```http
PUT /price/{sku}
```

Used by merchant portal to create or update product prices. Requires `PRICING_SPECIALIST` role.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| sku | Long | Product SKU identifier |

**Request Body:**
```json
{
  "price": 29.99,
  "originalPrice": 39.99,
  "currency": "USD"
}
```

**Validation:**
- `price` - Required, must be non-negative
- `originalPrice` - Optional
- `currency` - Optional, defaults to "USD"

**Response:**
```json
{
  "sku": 123456,
  "price": 29.99,
  "originalPrice": 39.99,
  "currency": "USD",
  "updatedAt": "2025-12-10T10:30:00Z"
}
```

**Status Codes:**
- `200 OK` - Price created or updated successfully
- `400 Bad Request` - Invalid request body

**Behavior:**
- If SKU exists: Updates price, originalPrice, currency, and updatedAt timestamp
- If SKU does not exist: Creates new price record with current timestamp

## Configuration

### Database (R2DBC)

```yaml
spring:
  r2dbc:
    url: r2dbc:postgresql://localhost:5432/pricedb
    username: price_user
    password: price_pass
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
    url: jdbc:postgresql://localhost:5432/pricedb
    user: price_user
    password: price_pass
    locations: classpath:db/migration
```

**Note:** Flyway requires a JDBC DataSource for migrations. R2DBC is used for runtime operations. See `FlywayConfiguration.java` for manual DataSource setup.

### Security

```yaml
app:
  security:
    enabled: false
```

Security is disabled in development. Set to `true` in production for JWT validation.

### Server

```yaml
server:
  port: 8092
```

## Database Schema

### Prices Table

```sql
CREATE TABLE prices (
    sku BIGINT PRIMARY KEY,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prices_updated_at ON prices(updated_at);
```

**Columns:**
- `sku` - Primary key, product SKU identifier
- `price` - Current selling price (required)
- `original_price` - Original/list price for discount calculation (optional)
- `currency` - ISO 4217 currency code (defaults to USD)
- `updated_at` - Last modification timestamp

**Indexes:**
- `idx_prices_updated_at` - Supports querying recently updated prices

## Running

### Local Development

**Prerequisites:**
- PostgreSQL 15+ running on port 5432
- Database `pricedb` created
- User `price_user` with password `price_pass`

**Setup Database:**
```bash
# Using psql
createdb pricedb
psql pricedb -c "CREATE USER price_user WITH PASSWORD 'price_pass';"
psql pricedb -c "GRANT ALL PRIVILEGES ON DATABASE pricedb TO price_user;"
psql pricedb -c "GRANT ALL ON SCHEMA public TO price_user;"
```

**Run with Gradle:**
```bash
./gradlew :apps:price-service:bootRun
```

Service will be available at `http://localhost:8092`

### Docker

```bash
# Build JAR
./gradlew :apps:price-service:bootJar

# Start with Docker Compose (includes PostgreSQL)
cd docker && docker compose up -d price-service
```

Service will be available at `http://localhost:8092`

**Docker uses separate configuration:**
- Database host: `postgres` (Docker service name)
- Spring profile: `docker` (loads `application-docker.yml`)

## Testing

```bash
# Run all tests
./gradlew :apps:price-service:test

# Run specific test class
./gradlew :apps:price-service:test --tests '*PriceServiceTest*'
```

**Test Infrastructure:**
- Testcontainers for PostgreSQL integration tests
- R2DBC test support from platform-test library

## Observability

### Health

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
    "diskSpace": {
      "status": "UP"
    },
    "ping": {
      "status": "UP"
    }
  }
}
```

### Metrics (Prometheus)

```http
GET /actuator/metrics
GET /actuator/prometheus
```

**Key Metrics:**
- `http_server_requests_seconds` - HTTP request latency
- `r2dbc_pool_acquired_size` - Active database connections
- `r2dbc_pool_idle_size` - Idle connection pool size
- `r2dbc_pool_pending_size` - Requests waiting for connection
- `jvm_memory_used_bytes` - JVM memory usage

### Logs

JSON-structured logs with:
- `timestamp` - ISO 8601 timestamp
- `level` - Log level (DEBUG, INFO, WARN, ERROR)
- `logger` - Class name
- `message` - Log message
- `traceId` / `spanId` - Distributed tracing identifiers
- `service.name` - Service identifier

**Log Levels (Local Development):**
```yaml
logging:
  level:
    org.example.price: DEBUG
    org.springframework.r2dbc: DEBUG
```

**Log Levels (Docker/Production):**
```yaml
logging:
  level:
    org.example.price: INFO
```

## Package Structure

```
org.example.price/
├── PriceServiceApplication.java
├── controller/
│   └── PriceController.java
├── service/
│   └── PriceService.java
├── repository/
│   ├── PriceEntity.java
│   └── PriceR2dbcRepository.java
├── dto/
│   ├── PriceResponse.java
│   └── UpdatePriceRequest.java
└── config/
    └── FlywayConfiguration.java
```

## Integration with Other Services

### Product Service

Product-service calls `GET /price/{sku}` to fetch pricing data during product aggregation.

**Service Discovery:**
- Local: `http://localhost:8092`
- Docker: `http://price-service:8092`

### Merchant Portal

Merchant portal uses all three endpoints:
- `GET /price?page=N` - Browse prices
- `GET /price/{sku}` - View specific price
- `PUT /price/{sku}` - Update price (requires authentication)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `pricedb` |
| `DB_USERNAME` | Database user | `price_user` |
| `DB_PASSWORD` | Database password | `price_pass` |

## Migration Management

Flyway automatically runs migrations on application startup:

1. Checks `flyway_schema_history` table for applied migrations
2. Executes pending migrations in order (V001, V002, etc.)
3. Records successful migrations in history table

**Migration Files Location:**
```
src/main/resources/db/migration/
├── V001__create_prices_table.sql
└── (future migrations)
```

**Migration Naming Convention:**
- `V{version}__{description}.sql`
- Example: `V002__add_discount_column.sql`

## Common Issues

### Database Connection Failed

**Symptoms:**
- `Connection refused` errors in logs
- Health endpoint shows `db: DOWN`

**Solutions:**
1. Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
2. Check database credentials in `application.yml`
3. Ensure database `pricedb` exists
4. Verify user `price_user` has correct permissions

### Flyway Migration Failed

**Symptoms:**
- Application fails to start
- Error: `Migration checksum mismatch`

**Solutions:**
1. Do not modify existing migration files
2. Create new migration file for schema changes
3. For development, drop and recreate database if needed
4. For production, use Flyway repair command

### R2DBC Pool Exhausted

**Symptoms:**
- Requests timeout under load
- Metrics show `r2dbc_pool_pending_size` increasing

**Solutions:**
1. Increase pool size: `spring.r2dbc.pool.max-size`
2. Check for connection leaks (missing `subscribe()` or incomplete reactive chain)
3. Monitor slow queries with `spring.r2dbc: DEBUG`
