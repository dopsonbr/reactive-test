# Config

## Boundaries
Files that require careful review before changes: ProductServiceConfig.java (WebClient configuration affects external service calls)

## Conventions
- All WebClient beans include logging filter keyed by repository name.
- Cache properties use `@ConfigurationProperties(prefix = "cache")` binding.

## Warnings
- Changing WebClient filter order may break context propagation to logs.
- Cache TTL changes require application restart; not refreshable at runtime.
