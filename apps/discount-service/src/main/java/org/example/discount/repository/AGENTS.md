# repository

## Boundaries

Files that require careful review before changes:
- Repository interfaces - changes affect all service layer operations
- InMemoryDiscountRepository - contains seed data for development

## Conventions

- All repository methods return Mono or Flux
- InMemory implementations use ConcurrentHashMap
- Repositories filter by validity and store context
- InMemoryDiscountRepository seeds sample promo codes on startup

## Warnings

- In-memory implementations lose data on restart (not production-ready)
- No persistence layer configured; production requires database integration
