# service

## Purpose

Business logic for customer operations including CRUD, search, and B2B hierarchy management.

## Behavior

CustomerService validates business rules, enforces email uniqueness per store, manages B2B parent-child relationships, and delegates to repository. Throws domain exceptions for validation failures.

## Quirks

- Deleting a B2B parent with sub-accounts throws BusinessRuleException
- Creating sub-accounts requires parent to be BUSINESS type
- Email uniqueness is scoped to store number, not global
