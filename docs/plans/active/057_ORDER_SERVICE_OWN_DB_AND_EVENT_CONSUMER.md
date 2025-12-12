# 057: Order Service Own DB + Event Consumer

**Status:** Draft (supersedes the *intent* of `docs/plans/completed/055D_ORDER_SERVICE.md`)

## Context

Today `order-service` reads (and updates) the `orders` table in `checkoutdb` for convenience. `checkout-service` already publishes `OrderCompleted` CloudEvents to Redis Streams (`orders:completed`) via `platform-events`, but `order-service` does not consume them.

We want `order-service` to have **its own database/tables** for scale and isolation. For local dev, we will still use the same Postgres *instance/container*, but with a separate database (e.g., `orderdb`).

## Goals

- `order-service` owns its persistence (separate DB + migrations).
- `order-service` consumes `checkout-service` `OrderCompleted` events from Redis Streams and **inserts** orders into its own DB.
- Keep existing REST/GraphQL APIs working (same shapes/semantics) while changing the backing store.
- Maintain at-least-once consumption with idempotent writes and DLQ on permanent failures.

## Non-Goals (for this plan)

- Publishing downstream “OrderUpdated” events from `order-service` (can be a follow-up plan).
- Designing a fully normalized order schema (initially reuse the current denormalized shape).
- Multi-tenant/sharding strategies.

## Key Decisions

1. **DB separation model**
   - Local dev: same Postgres container, separate DB `orderdb`.
   - Prod: separate Postgres cluster is an infra concern; code should only assume separate DB URL.
2. **Event contract**
   - Consume CloudEvents of type `org.example.checkout.OrderCompleted`.
   - `data` payload shape matches publisher: `{ checkoutSessionId, order }` where `order` is `org.example.model.order.Order`.
3. **Idempotency**
   - Primary mechanism: `orders.id` is the primary key; consumer inserts are idempotent via `INSERT ... ON CONFLICT DO NOTHING` (or equivalent) and/or duplicate-key handling.
4. **Consumer loop**
   - Do not use overlapping `@Scheduled` fire-and-forget subscriptions. Start a single loop on startup and stop it on shutdown (e.g., `SmartLifecycle` + `Disposable`).

## Phase 1 — Own Database Wiring (local dev + config)

### Task 1: Add `orderdb` to docker Postgres init

**Files**
- Modify: `docker/postgres/init-databases.sql`

**Steps**
1. Add:
   - `CREATE DATABASE orderdb;`
   - `CREATE USER order_user ...;`
   - Grants + schema privileges.

**Validation**
- Recreate docker volumes: `docker compose down -v && docker compose up -d postgres`
- Ensure DB exists: `psql -h localhost -U postgres -d postgres -c "\\l" | rg orderdb`

### Task 2: Point docker `order-service` at `orderdb`

**Files**
- Modify: `docker/docker-compose.yml`

**Steps**
1. Update `order-service` env:
   - `SPRING_R2DBC_URL` → `.../orderdb`
   - `SPRING_R2DBC_USERNAME`/`PASSWORD` → `order_user`/`order_pass`
2. Add Flyway env to match other services:
   - `SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/orderdb`
   - `SPRING_DATASOURCE_USERNAME=order_user`
   - `SPRING_DATASOURCE_PASSWORD=order_pass`
   - `SPRING_FLYWAY_URL=jdbc:postgresql://postgres:5432/orderdb`
   - `SPRING_FLYWAY_USER=order_user`
   - `SPRING_FLYWAY_PASSWORD=order_pass`
3. Add Redis env (if not already present):
   - `REDIS_HOST=redis` (or the compose service name)
   - `REDIS_PORT=6379`

**Validation**
- `docker compose up -d order-service` and check it connects to `orderdb` (logs / healthcheck).

### Task 3: Update `order-service` docs (AGENTS/README) to reflect target architecture

**Files**
- Modify: `apps/order-service/AGENTS.md`
- Modify: `apps/order-service/README.md`
- Modify: `apps/order-service/PACKAGES.md`
- Modify: `apps/order-service/src/main/java/org/example/order/repository/README.md`

**Steps**
1. Change wording from “shares checkoutdb.orders table” to:
   - “owns its own `orderdb.orders` table”
   - “local dev may run in the same Postgres container”
   - “orders are inserted from checkout events”
2. Remove/adjust “read/update only, no inserts” statements where they conflict with the consumer-based insert path (keep “API write semantics” separate from “storage writes”).

## Phase 2 — Schema + Migrations (order-service)

### Task 4: Add Flyway dependencies and configuration

**Files**
- Modify: `apps/order-service/build.gradle.kts`
- Create: `apps/order-service/src/main/java/org/example/order/config/FlywayConfiguration.java`

**Steps**
1. Add dependencies consistent with other services:
   - `spring-boot-starter-flyway`
   - `flyway-database-postgresql`
   - `spring-boot-starter-jdbc`
   - JDBC driver runtime dependency
2. Add `FlywayConfiguration` (see patterns in other apps’ `.../config/FlywayConfiguration.java`).

### Task 5: Add initial migration for `orders` table

**Files**
- Create: `apps/order-service/src/main/resources/db/migration/V1__create_orders_table.sql`

**Steps**
1. Start by copying the current `checkout-service` table shape (denormalized JSONB columns + indexes).
2. Ensure constraints match idempotent consumption:
   - `id UUID PRIMARY KEY`
   - unique index on `order_number`

**Validation**
- Run Flyway on `orderdb` (via docker compose startup or locally).

## Phase 3 — Model Alignment (shared-model-order)

### Task 6: Switch order-service domain imports to shared-model-order

**Files**
- Modify: multiple files in `apps/order-service/src/main/java/org/example/order/**`
- Delete: `apps/order-service/src/main/java/org/example/order/model/**` (service-local models)

**Steps**
1. Add dependency:
   - `implementation(project(":libs:backend:shared-model:shared-model-order"))`
2. Replace imports `org.example.order.model.*` → `org.example.model.order.*`.
3. Replace usages of `Order.withStatus(...)` / `Order.withFulfillmentDetails(...)` with service-local helpers (e.g., a small `OrderMutations` utility in `service/`).

**Validation**
- Compile and run unit tests for `order-service`.

## Phase 4 — Event Consumption + Persistence

### Task 7: Add event consumer dependencies

**Files**
- Modify: `apps/order-service/build.gradle.kts`
- Modify: `apps/order-service/src/main/resources/application.yml`

**Steps**
1. Add:
   - `implementation(project(":libs:backend:platform:platform-events"))`
   - `implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")`
2. Add config defaults:
   - `spring.data.redis.host/port`
   - `order.consumer.*` (`stream-key`, `consumer-group`, `consumer-name`, `batch-size`, `poll-interval`, `max-retries`, `retry-delay`)

### Task 8: Implement the consumer + handler

**Files**
- Create: `apps/order-service/src/main/java/org/example/order/consumer/OrderEventProperties.java`
- Create: `apps/order-service/src/main/java/org/example/order/consumer/OrderEventHandler.java`
- Create: `apps/order-service/src/main/java/org/example/order/consumer/OrderEventConsumer.java`
- Modify: `apps/order-service/src/main/java/org/example/order/OrderServiceApplication.java` (enable scheduling or lifecycle support)

**Implementation notes**
1. `OrderEventConsumer`
   - Extend `platform-events` `EventConsumer`
   - Filter by event type (`org.example.checkout.OrderCompleted`)
   - Deserialize event data to `record OrderCompletedEventData(String checkoutSessionId, Order order) {}`
   - Delegate persistence to `OrderEventHandler`
2. `OrderEventHandler`
   - Insert order into DB idempotently
   - Log with `orderId`, `orderNumber`, `eventId`, `checkoutSessionId`
3. Lifecycle
   - Initialize consumer group on startup.
   - Start a single, non-overlapping poll loop (avoid `@Scheduled` + `.subscribe(...)` per tick).

### Task 9: Add repository support for inserts

**Files**
- Modify: `apps/order-service/src/main/java/org/example/order/repository/OrderRepository.java`
- Modify: `apps/order-service/src/main/java/org/example/order/repository/PostgresOrderRepository.java`

**Steps**
1. Add a write method for consumer inserts, e.g.:
   - `Mono<Void> insertIfAbsent(Order order)` or `Mono<Boolean> insert(Order order)` (returns created?)
2. Implement using one of:
   - `DatabaseClient` with `INSERT ... ON CONFLICT DO NOTHING`
   - or `OrderEntityRepository` insert with duplicate-key handling

## Phase 5 — Tests + Rollout

### Task 10: Unit tests

**Files**
- Create: `apps/order-service/src/test/java/org/example/order/consumer/OrderEventHandlerTest.java`
- Create: `apps/order-service/src/test/java/org/example/order/consumer/OrderEventConsumerTest.java`

**Coverage**
- Idempotency: duplicate order doesn’t fail.
- Type filtering: non-OrderCompleted events are ignored.
- Null/invalid payload routes to ack/DLQ behavior (depending on desired semantics).

### Task 11: Integration test (recommended)

**Goal:** Prove end-to-end: publish to Redis stream → consumer persists to Postgres.

**Suggested approach**
- Use Testcontainers for Redis + Postgres.
- Start `order-service` Spring context with dynamic properties.
- Publish an event using `RedisStreamEventPublisher` (or directly via `ReactiveRedisTemplate`).
- Assert the order exists via repository query.

### Task 12: Backfill strategy (for non-ephemeral environments)

Pick one:
1. **Dev-only reset:** document `docker compose down -v` as the supported path.
2. **One-time backfill tool:** add a runnable job to copy `checkoutdb.orders` → `orderdb.orders` (while services still share the instance), then cut over reads.
3. **Event replay:** if Redis stream retention is sufficient, add a one-off “replay from offset” runner (requires extending `platform-events` consumer to support configurable `ReadOffset`).

## Validation Commands (Nx preferred)

- Build: `pnpm nx build :apps:order-service`
- Test: `pnpm nx test :apps:order-service`
- Build all affected: `pnpm nx affected -t build,test`

## Completion Checklist

- [ ] `orderdb` created in docker init
- [ ] `order-service` uses `orderdb` in docker compose
- [ ] Flyway migrations added + run successfully
- [ ] `order-service` uses `shared-model-order`
- [ ] Redis consumer consumes `orders:completed` and inserts orders
- [ ] Idempotent inserts + DLQ on permanent failure
- [ ] Unit tests for handler/consumer
- [ ] Integration test for end-to-end consumption
