# Service

## Boundaries
Files that require careful review before changes: ProductService.java (changes affect parallel execution and context propagation)

## Conventions
- Services return `Mono` or `Flux` (never block)
- Use `Mono.deferContextual` to access reactive context
- Parallelize independent repository calls with `Mono.zip`
- Log at service entry and exit using StructuredLogger

## Warnings
- Changing `Mono.zip` order affects tuple access in `.map()`
- Avoid blocking calls or `.block()` - breaks reactive chain
