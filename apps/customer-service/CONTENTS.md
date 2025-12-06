# Customer Service Contents

## Main Source (src/main/java/org/example/customer/)

| File | Description |
|------|-------------|
| `CustomerServiceApplication.java` | Spring Boot application entry point with platform package scanning |

### Controller Layer
| File | Description |
|------|-------------|
| `controller/CustomerController.java` | REST endpoints for customer CRUD, search, and B2B operations |
| `controller/dto/CreateCustomerRequest.java` | Request for creating new customer |
| `controller/dto/CustomerSearchRequest.java` | Search criteria for customer lookup |
| `controller/dto/UpdateCustomerRequest.java` | Request for updating existing customer |

### Exception Layer
| File | Description |
|------|-------------|
| `exception/BusinessRuleException.java` | Business rule violations (422 status) |
| `exception/CustomerNotFoundException.java` | Customer not found (404 status) |
| `exception/DuplicateCustomerException.java` | Duplicate email per store (409 status) |

### Repository Layer
| File | Description |
|------|-------------|
| `repository/CustomerEntity.java` | Database entity for customers table |
| `repository/CustomerEntityRepository.java` | Spring Data R2DBC repository |
| `repository/CustomerRepository.java` | Domain repository interface |
| `repository/PostgresCustomerRepository.java` | PostgreSQL implementation with JSONB handling |

### Security Layer
| File | Description |
|------|-------------|
| `security/SecurityConfig.java` | OAuth2 resource server with JWT validation |

### Service Layer
| File | Description |
|------|-------------|
| `service/CustomerService.java` | Customer business logic with B2B hierarchy support |

### Validation Layer
| File | Description |
|------|-------------|
| `validation/CustomerRequestValidator.java` | Request validation with error aggregation |

## Resources (src/main/resources/)

| File | Description |
|------|-------------|
| `application.yml` | PostgreSQL, OAuth2, and server configuration |
| `schema.sql` | PostgreSQL schema with JSONB columns |

## Key Dependencies

| Dependency | Purpose |
|------------|---------|
| platform-logging | Structured JSON logging |
| platform-webflux | Context propagation |
| platform-error | Global error handling |
| platform-security | OAuth2 JWT validation |
| spring-data-r2dbc | Reactive PostgreSQL |
