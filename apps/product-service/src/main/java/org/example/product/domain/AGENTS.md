# Domain

## Boundaries
Files requiring review before changes: SearchCriteria.java (search query parameters), SearchResponse.java (search API contract), SearchProduct.java (search result model)

## Conventions
- All models are Java records (immutable)
- SearchCriteria applies defaults in compact constructor
- No business logic in domain models

## Warnings
- Changing field types breaks API contract with consumers
