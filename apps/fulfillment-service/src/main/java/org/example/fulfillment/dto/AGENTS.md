# dto

## Boundaries

Files that require careful review before changes:
- All DTOs - changes affect checkout-service integration

## Conventions

- All DTOs are Java records (immutable)
- Response DTOs include all fields expected by checkout-service
- ShippingOption includes code, name, cost, and estimatedDays

## Warnings

- Changing DTO structure breaks checkout-service integration
- Response formats must match checkout-service expectations
