# order

## Boundaries
Files requiring careful review: OrderServiceApplication.java (component scan configuration)

## Conventions
- Component scanning includes org.example.order and org.example.platform.{logging,error,security}
- Spring Boot auto-configuration handles WebFlux, GraphQL, R2DBC, and Security setup
- Main class delegates entirely to SpringApplication.run

## Warnings
- Do not modify scanBasePackages without verifying all platform dependencies are included
- Application bootstraps both GraphQL and REST controllers from subpackages
