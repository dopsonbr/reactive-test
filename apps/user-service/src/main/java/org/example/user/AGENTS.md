# org.example.user

## Boundaries
Files requiring careful review: UserServiceApplication.java (component scan base packages)

## Conventions
- All database operations return Mono/Flux
- JWT tokens use RS256 signing algorithm
- Errors throw standard Spring exceptions handled by platform-error

## Warnings
- Never expose DevTokenController in production profiles
- JWT signing keys must be externalized for production deployments
