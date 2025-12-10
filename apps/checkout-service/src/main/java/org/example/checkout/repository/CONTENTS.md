# Contents

| File | Description |
|------|-------------|
| `JsonValue.java` | Wrapper type for JSONB column conversion in R2DBC |
| `OrderEntity.java` | Database entity implementing `Persistable<UUID>` for orders |
| `OrderEntityRepository.java` | Spring Data R2DBC repository with custom query methods |
| `OrderRepository.java` | Domain repository interface for order operations |
| `PostgresOrderRepository.java` | PostgreSQL implementation with JSONB handling and entity mapping |
