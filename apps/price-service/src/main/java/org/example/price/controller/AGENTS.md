# org.example.price.controller

## Boundaries
Files that require careful review before changes: none

## Conventions
- All endpoints return Mono or Flux
- Use ResponseEntity for explicit status codes
- Validate request bodies with @Valid

## Warnings
- GET /{sku} is service-to-service, must remain unauthenticated for product-service calls
