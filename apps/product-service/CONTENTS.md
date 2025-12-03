# Product Service Contents

## Main Source (src/main/java/org/example/product/)

### Application Entry
- `ProductServiceApplication.java` - Spring Boot application entry point

### Controller Layer
- `controller/ProductController.java` - REST endpoint for product aggregation

### Service Layer
- `service/ProductService.java` - Business logic orchestrating repository calls

### Repository Layer
- `repository/merchandise/MerchandiseRepository.java` - Merchandise service client (cache-aside)
- `repository/merchandise/MerchandiseResponse.java` - Response record
- `repository/price/PriceRepository.java` - Price service client (cache-aside)
- `repository/price/PriceRequest.java` - Request record
- `repository/price/PriceResponse.java` - Response record
- `repository/inventory/InventoryRepository.java` - Inventory service client (fallback-only)
- `repository/inventory/InventoryRequest.java` - Request record
- `repository/inventory/InventoryResponse.java` - Response record

### Domain Layer
- `domain/Product.java` - Product aggregate record

### Configuration
- `config/ProductServiceConfig.java` - WebClient and bean configuration
- `config/CacheProperties.java` - Cache TTL configuration properties

### Validation
- `validation/ProductRequestValidator.java` - Request header/param validation

### Security
- `security/SecurityConfig.java` - OAuth2 resource server configuration
- `security/OAuth2ClientConfig.java` - Client credentials for downstream services

## Resources (src/main/resources/)
- `application.yml` - Application configuration (resilience4j, cache, security)

## Test Source (src/test/java/org/example/product/)
- `ProductServiceApplicationTest.java` - Context load test
- `ProductServiceIntegrationTest.java` - Integration test with Redis + WireMock
- `ArchitectureTest.java` - ArchUnit layered architecture enforcement

## Key Dependencies

| Dependency | Purpose |
|------------|---------|
| platform-logging | Structured JSON logging |
| platform-resilience | ReactiveResilience wrapper |
| platform-cache | Redis cache abstraction |
| platform-error | Global error handling |
| platform-webflux | Context propagation |
| platform-security | OAuth2/JWT validation |
| platform-test | Test utilities (WireMock, Redis, Reactor) |
