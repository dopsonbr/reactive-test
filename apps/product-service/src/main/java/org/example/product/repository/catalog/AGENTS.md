# repository.catalog

## Boundaries
Files that require careful review before changes:
- `CatalogSearchRepository.java` - External API contract, resilience configuration, and error handling strategy

## Conventions
- All operations decorated with resilience patterns using "catalog" resilience name
- WebClient injected via `@Qualifier("catalogWebClient")`
- Internal DTOs defined as private records for API mapping
- Errors logged with circuit breaker state before propagation or degradation

## Warnings
- Changing error handling strategy affects caller behavior (suggestions degrade, search propagates)
- Circuit breaker name "catalog" must match resilience configuration in application.yml
- Suggestions endpoint returns empty list on error (graceful degradation) - do not change without impact assessment
