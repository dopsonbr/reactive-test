# org.example.product

## Boundaries
Files requiring careful review: ProductServiceApplication.java (scanBasePackages affects dependency injection)

## Conventions
- All services return Mono/Flux (reactive streams)
- All WebClient calls use resilience decoration
- All repository calls apply cache-aside pattern
- Errors propagate via Reactor Context, never MDC

## Warnings
- Never use thread-local storage (MDC, ThreadLocal) in reactive code
- Security can be disabled via app.security.enabled=false for load testing
