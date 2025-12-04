# Contents

| File | Description |
|------|-------------|
| `AuditServiceApplication.java` | Spring Boot application entry point with scheduling enabled |
| `config/AuditConsumerProperties.java` | Configuration properties for Redis Streams consumer |
| `config/R2dbcConfig.java` | R2DBC database configuration |
| `consumer/AuditEventConsumer.java` | Scheduled consumer for processing audit events from Redis Streams |
| `consumer/DeadLetterHandler.java` | Handles permanently failed audit events |
| `controller/AuditController.java` | REST endpoints for creating and querying audit events |
| `domain/AuditRecord.java` | R2DBC entity mapping to audit_events table |
| `domain/TimeRange.java` | Value object for time-based query filtering |
| `repository/AuditRepository.java` | Repository interface for audit event persistence |
| `repository/R2dbcAuditRepository.java` | R2DBC implementation of audit repository |
| `service/AuditService.java` | Business logic for audit event operations |
