# Config

## Boundaries
Files that require careful review before changes: WebClientLoggingFilter.java (propagates Reactor Context to logs)

## Conventions
- All WebClient beans include logging filter keyed by repository name.
- Redis serialization uses Jackson with ObjectMapper for JSON support.
- Cache properties use `@ConfigurationProperties(prefix = "cache")` binding.

## Warnings
- Changing WebClient filter order may break context propagation to logs.
- Cache TTL changes require application restart; not refreshable at runtime.
