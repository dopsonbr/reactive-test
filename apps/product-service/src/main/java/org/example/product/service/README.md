# Service

## Purpose
Orchestrates business logic by composing repository calls into domain aggregates.

## Behavior
Executes repository calls in parallel using reactive streams, combines results into domain objects, and propagates reactive context for logging and tracing.

## Quirks
- ProductService executes repository calls in parallel via `Mono.zip`
- ProductSearchService uses cache-aside pattern for search results and suggestions
- Context propagation relies on `Mono.deferContextual` to capture request metadata
