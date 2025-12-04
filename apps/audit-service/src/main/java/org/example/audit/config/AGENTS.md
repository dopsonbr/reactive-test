# config

## Boundaries
Files that require careful review before changes: R2dbcConfig.java (affects database transaction behavior), AuditConsumerProperties.java (changing defaults impacts all environments)

## Conventions
- All configuration classes use Spring Boot auto-configuration
- Properties use kebab-case in YAML (audit.consumer.stream-key)
- Defaults favor reliability over throughput (batch size 100, 3 retries, 1s retry delay)

## Warnings
- Changing batchSize or pollInterval affects backpressure and memory consumption
- R2dbcEntityTemplate bean is required for manual SQL operations; do not remove
- AuditConsumerProperties compact constructor validates and applies defaults at binding time
