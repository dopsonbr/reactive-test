# service

## Boundaries

Files that require careful review before changes:
- `CustomerService.java` - core business logic affects all customer operations

## Conventions

- All methods return Mono or Flux
- Duplicate email checks happen before creation
- B2B hierarchy validation occurs before save
- Sub-accounts inherit parent's store number
- Loyalty tier defaults to null on creation
- Structured logging at significant business events

## Warnings

- B2B parent deletion fails if sub-accounts exist
- Email uniqueness is per-store, allowing same email across stores
- Sub-account creation bypasses standard create flow for B2B setup
- Do not bypass service layer for direct repository access
