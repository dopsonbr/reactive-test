# Validation

## Boundaries
Files that require careful review before changes: ProductRequestValidator.java (validation rules match expected request format), SearchRequestValidator.java (search parameter validation rules)

## Conventions
- All validators return `Mono<Void>` that errors on validation failure
- Validation errors collected together, not fail-fast
- UUID validation uses regex pattern matching

## Warnings
- Changing SKU or store number ranges affects valid request space
- UUID and user ID patterns must align with client expectations
- Validator is a Spring Component (singleton), keep stateless
