# Resilience

## Purpose
Applies Resilience4j fault tolerance patterns to reactive streams, protecting the application from cascading failures when external services are degraded or unavailable.

## Behavior
Wraps Mono publishers with four resilience decorators in a specific order: timeout (innermost), circuit breaker, retry, and bulkhead (outermost). Each decorator is configured via application.yml using a named instance that matches the service being protected.

## Quirks
- Decorator order matters: timeout executes first to bound each attempt, then circuit breaker fails fast, then retry handles transient failures, finally bulkhead limits concurrency
- The name parameter must match a configured Resilience4j instance or defaults will be used
