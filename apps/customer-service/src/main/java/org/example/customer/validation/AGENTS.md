# validation

## Boundaries

Files that require careful review before changes:
- `CustomerRequestValidator.java` - validation rules affect all endpoints

## Conventions

- Validators return `Mono<Void>` (empty on success, error on failure)
- Errors aggregated and returned as ValidationException
- Common headers validated in all requests
- Business type customers require companyInfo
- Search requests require at least one search criterion

## Warnings

- Validation errors map to 400 Bad Request in controller
- Email regex is simple validation, not RFC-compliant
- Phone regex requires international format
- Changing validation rules is a breaking API change
