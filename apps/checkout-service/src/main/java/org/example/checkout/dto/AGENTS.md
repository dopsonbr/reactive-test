# dto

## Boundaries

Files that require careful review before changes: none (pure data carriers)

## Conventions

- All DTOs are Java records (immutable)
- Validation happens in CheckoutRequestValidator, not in DTOs
- Response DTOs mirror domain models for API serialization

## Warnings

- Changing DTO structure is a breaking API change
- InitiateCheckoutRequest requires cartId and fulfillment details
- CompleteCheckoutRequest requires checkoutSessionId from initiate response
