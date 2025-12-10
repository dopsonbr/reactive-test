# validation

## Boundaries

Files that require careful review before changes:
- `DiscountRequestValidator.java` - validation rules affect all endpoints

## Conventions

- Collects all errors before throwing (returns `Map<String, String>`)
- Store number must be 1-2000
- Discount codes cannot be blank
- Cart IDs and markdown IDs cannot be blank
- User IDs must be non-blank for markdown operations
- PricingRequest requires storeNumber and items

## Warnings

- Validation errors map to 400 Bad Request in controllers
- Missing header validation (x-userid) happens in validator, not controller
- Changing validation rules is a breaking API change
