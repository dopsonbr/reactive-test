# Contents

| File | Description |
|------|-------------|
| `build.gradle.kts` | Gradle build configuration with platform libraries and R2DBC dependencies |
| `src/main/java/org/example/price/PriceServiceApplication.java` | Spring Boot main application class with component scanning |
| `src/main/java/org/example/price/config/FlywayConfiguration.java` | Manual JDBC DataSource configuration for Flyway migrations with R2DBC |
| `src/main/java/org/example/price/controller/PriceController.java` | REST endpoints for get, list, and update price operations |
| `src/main/java/org/example/price/dto/PriceResponse.java` | Response DTO for service-to-service price API |
| `src/main/java/org/example/price/dto/UpdatePriceRequest.java` | Request DTO with validation constraints for price updates |
| `src/main/java/org/example/price/repository/PriceEntity.java` | R2DBC entity mapped to prices table with Java record |
| `src/main/java/org/example/price/repository/PriceR2dbcRepository.java` | Spring Data R2DBC repository with pagination support |
| `src/main/java/org/example/price/service/PriceService.java` | Business logic for get, list, and upsert price operations |
| `src/main/resources/application.yml` | Local development configuration for R2DBC, Flyway, and server |
| `src/main/resources/application-docker.yml` | Docker Compose configuration overrides |
| `src/main/resources/db/migration/V001__create_prices_table.sql` | Initial Flyway migration creating prices table and index |
