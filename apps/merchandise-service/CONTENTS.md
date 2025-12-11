# Contents

| File | Description |
|------|-------------|
| `MerchandiseServiceApplication.java` | Spring Boot application entry point with component scanning |
| `controller/MerchandiseController.java` | REST endpoints for product CRUD and service integration |
| `service/MerchandiseService.java` | Business logic for product operations and entity transformations |
| `repository/ProductEntity.java` | R2DBC entity mapping for products table |
| `repository/ProductR2dbcRepository.java` | Spring Data R2DBC repository with pagination support |
| `dto/MerchandiseResponse.java` | Minimal DTO for product-service integration |
| `dto/CreateProductRequest.java` | Product creation request with validation constraints |
| `dto/UpdateProductRequest.java` | Partial product update request with optional fields |
| `config/FlywayConfiguration.java` | JDBC DataSource configuration for Flyway migrations with R2DBC |
| `application.yml` | R2DBC connection pool, Flyway, security, and logging configuration |
| `application-docker.yml` | Docker-specific configuration overrides |
| `db/migration/V001__create_products_table.sql` | Initial database schema with products table and indexes |
| `build.gradle.kts` | Gradle build configuration with platform dependencies |
