# exception

## Boundaries

Files that require careful review before changes: none

## Conventions

- All exceptions extend RuntimeException
- HTTP status defined via @ResponseStatus annotation
- CustomerNotFoundException for 404
- DuplicateCustomerException for 409 (duplicate email per store)
- BusinessRuleException for 422 (B2B hierarchy violations)

## Warnings

- GlobalErrorHandler from platform-error handles exception to response mapping
- Do not catch these exceptions in service layer; let controllers handle HTTP mapping
