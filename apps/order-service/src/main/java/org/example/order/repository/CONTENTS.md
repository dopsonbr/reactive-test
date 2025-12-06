# Contents

| File | Description |
|------|-------------|
| `OrderRepository.java` | Domain repository interface for reactive order operations |
| `PostgresOrderRepository.java` | R2DBC implementation with entity-to-model mapping and JSON serialization |
| `OrderEntity.java` | R2DBC entity mapped to orders table with JSONB columns |
| `OrderEntityRepository.java` | Spring Data R2DBC repository with custom queries |
| `JsonValue.java` | Wrapper type for JSONB column values enabling custom converters |
