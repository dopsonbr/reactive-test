# Config

## Purpose
Configures application infrastructure for external HTTP calls, Redis caching, and observability.

## Behavior
Provides named WebClient beans with logging filters for each external service, configures Redis with JSON serialization for reactive caching, and exposes cache TTL settings via properties.

## Quirks
- WebClient logging filter cannot extract request body due to WebFlux API limitations.
- Cache TTL defaults: merchandise 15m, price 2m, inventory 30s.
