# Customer Service

Customer profile management service with PostgreSQL persistence and B2B hierarchy support.

## Purpose

Manages customer profiles including personal information, contact details, addresses, loyalty tiers, and B2B account hierarchies with parent-child relationships.

## Behavior

Exposes REST API for customer CRUD operations, search by multiple criteria (email, phone, customer ID), and B2B sub-account management. Enforces email uniqueness per store and validates business rules for account types.

## Features

- **Customer Management**: Full CRUD for individual and business customers
- **B2B Hierarchy**: Parent-child account relationships with sub-account management
- **Search**: Multi-criteria search by customer ID, email, or phone
- **PostgreSQL Persistence**: R2DBC reactive database with JSONB columns
- **OAuth2 Security**: Resource server with JWT validation and scope-based authorization
- **Validation**: Comprehensive request validation with error aggregation
- **Structured Logging**: JSON logs with trace correlation

## API Endpoints

All endpoints require the following headers:

| Header | Required | Format | Description |
|--------|----------|--------|-------------|
| x-store-number | Yes | 1-2000 | Store context |
| x-order-number | Yes | UUID | Order correlation |
| x-userid | Yes | 6 alphanumeric | User identifier |
| x-sessionid | Yes | UUID | Session correlation |
| Authorization | Yes | Bearer JWT | OAuth2 token with customer:read, customer:write, or customer:delete scope |

### Customer Lifecycle

| Method | Path | Description | Scope |
|--------|------|-------------|-------|
| POST | `/customers` | Create new customer | customer:write |
| GET | `/customers/{customerId}` | Get customer by ID | customer:read |
| PUT | `/customers/{customerId}` | Update customer | customer:write |
| DELETE | `/customers/{customerId}` | Delete customer | customer:delete |

### Search

| Method | Path | Description | Scope |
|--------|------|-------------|-------|
| GET | `/customers/search?customerId={id}` | Search by customer ID | customer:read |
| GET | `/customers/search?email={email}` | Search by email | customer:read |
| GET | `/customers/search?phone={phone}` | Search by phone | customer:read |

### B2B Hierarchy

| Method | Path | Description | Scope |
|--------|------|-------------|-------|
| GET | `/customers/{customerId}/sub-accounts` | Get sub-accounts for B2B parent | customer:read |
| POST | `/customers/{customerId}/sub-accounts` | Create sub-account under parent | customer:write |

## Request/Response Examples

### Create Customer

```http
POST /customers
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "storeNumber": 100,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+12125551234",
  "type": "INDIVIDUAL"
}
```

### Create B2B Customer

```http
POST /customers
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "storeNumber": 100,
  "name": "Acme Corp",
  "email": "purchasing@acme.com",
  "type": "BUSINESS",
  "companyInfo": {
    "name": "Acme Corporation",
    "taxId": "12-3456789"
  }
}
```

### Search Customers

```http
GET /customers/search?email=john.doe@example.com
Authorization: Bearer <jwt-token>
```

## Architecture

```
CustomerController
        ↓
CustomerRequestValidator
        ↓
CustomerService
        ↓
CustomerRepository (interface)
        ↓
PostgresCustomerRepository
        ↓
CustomerEntityRepository (Spring Data R2DBC)
        ↓
PostgreSQL
```

## Configuration

```yaml
server:
  port: 8083

spring:
  r2dbc:
    url: r2dbc:postgresql://localhost:5432/customerdb
    username: customer_user
    password: customer_pass
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${OAUTH_ISSUER_URI}
          jwk-set-uri: ${OAUTH_JWKS_URI}
```

## Running

### Local Development

```bash
# Start PostgreSQL
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_DB=customerdb \
  -e POSTGRES_USER=customer_user \
  -e POSTGRES_PASSWORD=customer_pass \
  postgres:15-alpine

# Run with Gradle
./gradlew :apps:customer-service:bootRun
```

### Docker Compose

```bash
# Build JAR
./gradlew :apps:customer-service:bootJar

# Start full stack
cd docker && docker compose up -d
```

## Testing

```bash
# Run all tests
./gradlew :apps:customer-service:test

# Run specific test class
./gradlew :apps:customer-service:test --tests '*CustomerServiceTest*'
```

## Observability

### Metrics
```http
GET /actuator/prometheus
```

### Health
```http
GET /actuator/health
```

## Package Structure

```
org.example.customer/
├── CustomerServiceApplication.java
├── controller/
│   ├── CustomerController.java
│   └── dto/
│       ├── CreateCustomerRequest.java
│       ├── CustomerSearchRequest.java
│       └── UpdateCustomerRequest.java
├── exception/
│   ├── BusinessRuleException.java
│   ├── CustomerNotFoundException.java
│   └── DuplicateCustomerException.java
├── repository/
│   ├── CustomerEntity.java
│   ├── CustomerEntityRepository.java
│   ├── CustomerRepository.java
│   └── PostgresCustomerRepository.java
├── security/
│   └── SecurityConfig.java
├── service/
│   └── CustomerService.java
└── validation/
    └── CustomerRequestValidator.java
```
