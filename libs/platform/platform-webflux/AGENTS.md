# Platform WebFlux

## Boundaries
Files that require careful review before changes: all (this is a core context propagation library)

## Conventions
- Use Reactor Context, never MDC or ThreadLocal
- All request metadata is immutable
- Context keys are string constants, not typed keys
- Metadata propagates via `contextWrite()` at controller boundary

## Warnings
- Adding new context keys affects all services that use platform-webflux
- Do not add mutable state to RequestMetadata
- Thread-local storage (MDC) will not work in reactive chains
