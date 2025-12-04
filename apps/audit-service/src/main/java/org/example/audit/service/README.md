# Service Layer

## Purpose
Provides business logic for audit event operations including query validation and result pagination.

## Behavior
Accepts audit event queries from controllers, normalizes query parameters (limits and time ranges), and delegates persistence operations to the repository layer. Returns reactive streams of audit events matching query criteria.

## Quirks
- Limits below 1 default to 100, limits above 1000 are capped at 1000
- Null time ranges default to unbounded queries
