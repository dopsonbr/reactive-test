# controller

## Boundaries
Files requiring careful review: MerchandiseController.java (external API contract)

## Conventions
- All methods return Mono or Flux reactive types
- Use @Valid for request validation
- Return ResponseEntity for proper HTTP status codes

## Warnings
- Changing MerchandiseResponse breaks product-service contract
