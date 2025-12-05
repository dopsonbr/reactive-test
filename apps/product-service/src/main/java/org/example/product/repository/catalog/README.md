# repository.catalog

## Purpose
Provides reactive access to the external Catalog Service API for product search and autocomplete suggestions.

## Behavior
The repository translates domain search criteria into HTTP requests, applies resilience patterns (circuit breaker, retry, timeout), and converts API responses back to domain models. Suggestions degrade gracefully to empty lists on error; search operations propagate errors after logging.

## Quirks
- Circuit breaker state is "catalog" (shared across search and suggestions)
- Suggestions return empty list on failure (non-blocking degradation)
- Search errors propagate after structured logging with circuit breaker state
