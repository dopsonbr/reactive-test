# Customer Service Agent Guidelines

Customer profile management with PostgreSQL persistence and B2B hierarchy support.

## Boundaries

Files that require careful review before changes:

| File | Reason |
|------|--------|
| `CustomerService.java` | Core business logic including B2B hierarchy rules |
| `CustomerRequestValidator.java` | Validation rules affect all endpoints |
| `PostgresCustomerRepository.java` | JSON serialization for nested data |
| `SecurityConfig.java` | OAuth2 scopes for customer operations |

## Conventions

- All service methods return Mono or Flux (reactive streams)
- Controllers propagate RequestMetadata via Reactor Context using ContextKeys
- Email uniqueness enforced per store, not globally
- B2B parent-child hierarchy uses parentCustomerId in B2BInfo
- Validation collects all errors before throwing ValidationException
- Customer types: INDIVIDUAL, BUSINESS
- Customer statuses: ACTIVE, INACTIVE, SUSPENDED, CLOSED

## Warnings

- Email uniqueness is scoped to store number; same email allowed across different stores
- Deleting B2B parent with sub-accounts throws BusinessRuleException
- Sub-account creation requires parent to be BUSINESS type
- JSON serialization for nested objects (addresses, wallet, loyalty) uses JSONB columns
- Customer delete requires customer:delete scope (separate from customer:write)
