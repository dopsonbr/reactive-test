# controller

## Boundaries
DevTokenController requires review if profile conditions change.

## Conventions
- All endpoints return Mono or Flux
- DTOs validated with Jakarta Validation annotations
- Requests handled by service layer, controllers are thin

## Warnings
- DevTokenController must never be enabled in production
- WellKnownController endpoints must remain publicly accessible
