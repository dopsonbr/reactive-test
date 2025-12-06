# controller.dto

## Boundaries

Files that require careful review before changes: none (pure data carriers)

## Conventions

- All DTOs are Java records (immutable)
- Business type customers require companyInfo field
- Optional fields use null, not empty strings
- Validation happens in CustomerRequestValidator, not in DTOs

## Warnings

- Changing DTO structure is a breaking API change
- CreateCustomerRequest type field determines required nested fields
