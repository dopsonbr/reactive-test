# validation

## Boundaries

Files that require careful review before changes:
- `CheckoutRequestValidator.java` - validation rules affect all checkout operations
- `CartValidator.java` - cart state rules affect checkout eligibility

## Conventions

- Validators return `Mono<Void>` (empty on success, error on failure)
- All errors aggregated before throwing ValidationException
- Store number must be 1-2000
- UUIDs validated for proper format
- Delivery fulfillment requires address details
- Pickup fulfillment requires store selection
- Cart must have at least one item to checkout

## Warnings

- Validation errors map to 400 Bad Request in controller
- CartValidator runs against cart-service response, not local data
- Changing validation rules is a breaking API change
- Missing headers result in immediate validation failure
