# controller

## Boundaries

Files that require careful review before changes:
- `CustomerController.java` - endpoint changes affect API contract with clients

## Conventions

- All endpoints return Mono or Flux
- Context establishment via contextWrite at end of reactive chain
- Request validation happens before service calls
- Four metadata headers required on all endpoints
- Scopes: customer:read for queries, customer:write for mutations, customer:delete for deletion

## Warnings

- Changing endpoint paths or header names breaks client contracts
- Search criteria are mutually exclusive; provide only one
- Delete operation requires separate customer:delete scope
