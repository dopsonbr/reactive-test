# service

## Boundaries
JwtService requires review if token claims or signing algorithm changes.

## Conventions
- All service methods return Mono or Flux
- Services delegate to repositories for persistence
- Business logic exceptions bubble to GlobalErrorHandler

## Warnings
- JWT token expiration must align with security requirements
- Password encoder changes require migration strategy
