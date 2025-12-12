# dto

## Boundaries
Files requiring careful review: MerchandiseResponse.java (product-service contract)

## Conventions
- All DTOs are Java records (immutable)
- Use Jakarta validation annotations on request DTOs
- Response DTOs have no validation

## Warnings
- MerchandiseResponse changes require product-service coordination
