# Merchandise Service

Product catalog management service for the merchant portal with CRUD operations backed by PostgreSQL.

## Features

- **Product Catalog Management**: Create, read, update, and delete product records
- **Service-to-Service API**: Provides product data to product-service for aggregation
- **Merchant Portal API**: Full CRUD operations for merchant users (requires MERCHANT role)
- **Reactive R2DBC**: Non-blocking database access with Spring Data R2DBC
- **PostgreSQL**: Persistent storage with Flyway migrations
- **Pagination**: Efficient list operations with page/size parameters
- **Structured Logging**: JSON logs with trace correlation
- **Validation**: Request validation with Jakarta Bean Validation

## API Endpoints

### Get Product by SKU

```http
GET /merchandise/{sku}
```

Returns product metadata for service-to-service integration with product-service.

**Response:**
```json
{
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse with USB receiver",
  "imageUrl": "https://example.com/images/mouse.jpg",
  "category": "Electronics"
}
```

### List Products

```http
GET /merchandise?page={page}&size={size}
```

Returns paginated list of all products. Used by merchant portal for product browsing.

**Query Parameters:**
| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| page | No | 0 | Page number (zero-indexed) |
| size | No | 20 | Page size |

**Response:**
```json
[
  {
    "sku": 123456,
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse",
    "imageUrl": "https://example.com/images/mouse.jpg",
    "category": "Electronics",
    "suggestedRetailPrice": 29.99,
    "currency": "USD",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
]
```

### Create Product

```http
POST /merchandise
```

Creates a new product. Requires MERCHANT role.

**Request Body:**
```json
{
  "sku": 123456,
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse",
  "imageUrl": "https://example.com/images/mouse.jpg",
  "category": "Electronics",
  "suggestedRetailPrice": 29.99,
  "currency": "USD"
}
```

**Validation Rules:**
- `sku`: Required, must be positive
- `name`: Required, not blank
- `suggestedRetailPrice`: Required, minimum 0.01
- `currency`: Optional, defaults to "USD"

**Response:** `201 Created` with created product entity

### Update Product

```http
PUT /merchandise/{sku}
```

Updates an existing product. Requires MERCHANT role. All fields are optional; only provided fields will be updated.

**Request Body:**
```json
{
  "name": "Updated Wireless Mouse",
  "suggestedRetailPrice": 24.99
}
```

**Validation Rules:**
- `suggestedRetailPrice`: If provided, minimum 0.01

**Response:** `200 OK` with updated product, or `404 Not Found` if SKU does not exist

### Delete Product

```http
DELETE /merchandise/{sku}
```

Deletes a product by SKU. Requires MERCHANT role.

**Response:** `204 No Content`

### Health Check

```http
GET /actuator/health
```

Returns service health including database connectivity.

## Architecture

```
MerchandiseController
       ↓
MerchandiseService
       ↓
ProductR2dbcRepository
       ↓
PostgreSQL (R2DBC)
```

**Dual-Use API Design:**
- `GET /merchandise/{sku}` returns minimal response for product-service integration
- `GET /merchandise` and mutation operations return full ProductEntity for merchant portal

## Database Schema

### Products Table

```sql
CREATE TABLE products (
    sku BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(512),
    category VARCHAR(100),
    suggested_retail_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
```

## Configuration

### Database Connection

```yaml
spring:
  r2dbc:
    url: r2dbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:merchandisedb}
    username: ${DB_USERNAME:merchandise_user}
    password: ${DB_PASSWORD:merchandise_pass}
    pool:
      initial-size: 5
      max-size: 20
      max-idle-time: 30m
```

### Flyway Migrations

Flyway runs migrations using a JDBC connection (R2DBC does not support schema migrations). The FlywayConfiguration bean creates a dedicated DataSource for Flyway when R2DBC is the primary data access technology.

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
```

### Security

Security is disabled by default for development. Enable OAuth2 JWT validation in production:

```yaml
app:
  security:
    enabled: false  # Set to true in production
```

## Running

### Local Development

**Prerequisites:**
- PostgreSQL running on localhost:5432
- Database `merchandisedb` created
- User `merchandise_user` with password `merchandise_pass`

```bash
# Start PostgreSQL with Docker
docker run -d --name postgres \
  -e POSTGRES_DB=merchandisedb \
  -e POSTGRES_USER=merchandise_user \
  -e POSTGRES_PASSWORD=merchandise_pass \
  -p 5432:5432 \
  postgres:16-alpine

# Run with Gradle
./gradlew :apps:merchandise-service:bootRun

# Or with Nx
pnpm nx run :apps:merchandise-service:bootRun
```

Service runs on **http://localhost:8091**

### Docker

```bash
# Build JAR
./gradlew :apps:merchandise-service:bootJar

# Start with Docker Compose (includes PostgreSQL + observability stack)
cd docker && docker compose up -d merchandise-service
```

## Testing

```bash
# Run all tests
./gradlew :apps:merchandise-service:test

# Or with Nx
pnpm nx test :apps:merchandise-service
```

**Note:** Tests use Testcontainers for PostgreSQL integration tests.

## Observability

### Metrics (Prometheus)

```http
GET /actuator/prometheus
```

Key metrics:
- `http_server_requests_seconds` - Request latency
- `r2dbc_pool_*` - Connection pool stats
- `spring_data_repository_invocations_seconds` - Repository operation timing

### Logs

JSON-structured logs with:
- `traceId` / `spanId` for distributed tracing
- Component-specific logger names
- DEBUG level for local development, INFO for Docker

### Health

```http
GET /actuator/health
```

Includes R2DBC database connectivity check.

## Package Structure

```
org.example.merchandise/
├── MerchandiseServiceApplication.java
├── controller/
│   └── MerchandiseController.java
├── service/
│   └── MerchandiseService.java
├── repository/
│   ├── ProductEntity.java
│   └── ProductR2dbcRepository.java
├── dto/
│   ├── MerchandiseResponse.java
│   ├── CreateProductRequest.java
│   └── UpdateProductRequest.java
└── config/
    └── FlywayConfiguration.java
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_NAME | merchandisedb | Database name |
| DB_USERNAME | merchandise_user | Database user |
| DB_PASSWORD | merchandise_pass | Database password |
| SERVER_PORT | 8091 | HTTP server port |

## Integration with Other Services

### Product Service

Product-service calls `GET /merchandise/{sku}` to retrieve product metadata during product aggregation. This endpoint returns a minimal `MerchandiseResponse` containing only fields needed for aggregation (name, description, imageUrl, category).

### Merchant Portal

The merchant portal frontend calls the full CRUD API (`GET /merchandise`, `POST /merchandise`, `PUT /merchandise/{sku}`, `DELETE /merchandise/{sku}`) to manage the product catalog. These endpoints return or accept full `ProductEntity` objects with all fields including pricing and timestamps.
