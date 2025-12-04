# DTO

## Boundaries
Files requiring review before changes: all (API contract)

## Conventions
- All DTOs are Java records (immutable)
- SKU represented as long for consistency with domain models
- Nullable fields indicate optional values (customerId)

## Warnings
- Changing field names or types breaks API contract with consumers
