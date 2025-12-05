# Domain

## Boundaries
Files requiring review before changes: Product.java (API contract), SearchResponse.java (search API contract), SearchCriteria.java (search query parameters)

## Conventions
- All models are Java records (immutable)
- Price represented as String for exact decimal values
- No business logic in domain models

## Warnings
- Changing field types breaks API contract with consumers
