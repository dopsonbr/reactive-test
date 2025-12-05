# GraphQL Input

## Boundaries
Files requiring careful review: none (simple data records)

## Conventions
- All input types are Java records
- Validation performed by GraphQLInputValidator, not annotations
- Field names match GraphQL schema conventions

## Warnings
- Do not add validation annotations; use validator instead
