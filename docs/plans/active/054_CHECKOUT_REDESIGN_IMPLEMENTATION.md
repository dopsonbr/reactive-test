# Checkout Service Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform checkout-service from direct order storage to event-driven orchestration layer

**Architecture:** Checkout-service orchestrates cart→order conversion, publishes CloudEvents to Redis Streams, order-service consumes and persists. Shared models in dedicated library, reusable event infrastructure in platform-events.

**Tech Stack:** Spring WebFlux, Redis Streams, CloudEvents SDK 4.0.1, R2DBC PostgreSQL

---

## Sub-Plans

This implementation is divided into focused sub-plans for parallel or sequential execution:

| Sub-Plan | Description | Dependencies | Est. Tasks |
|----------|-------------|--------------|------------|
| [054A](054A_SHARED_MODEL_ORDER.md) | Create shared-model-order library | None | 12 |
| [054B](054B_PLATFORM_EVENTS.md) | Create platform-events library | None | 15 |
| [054C](054C_CHECKOUT_SERVICE.md) | Update checkout-service | 054A, 054B | 25 |
| [054D](054D_ORDER_SERVICE.md) | Update order-service consumer | 054A, 054B | 18 |

**Recommended execution order:**
1. 054A and 054B can run in parallel (no dependencies)
2. 054C after 054A and 054B complete
3. 054D after 054A and 054B complete (can parallel with 054C)

---

## Pre-Implementation Checklist

Before starting any sub-plan:

- [ ] Create feature branch: `git checkout -b feat/054-checkout-redesign`
- [ ] Verify build passes: `pnpm nx run-many -t build`
- [ ] Verify tests pass: `pnpm nx run-many -t test`

---

## Design Reference

See [054_CHECKOUT_SERVICE_REDESIGN.md](054_CHECKOUT_SERVICE_REDESIGN.md) for full design decisions.

---

## Key Files Reference

### Existing Files to Understand

| File | Purpose |
|------|---------|
| `libs/backend/platform/platform-audit/` | Reference for Redis Streams publisher |
| `apps/audit-service/src/main/java/org/example/audit/consumer/` | Reference for Redis Streams consumer |
| `apps/checkout-service/src/main/java/org/example/checkout/model/` | Models to move to shared-model |
| `apps/checkout-service/src/main/java/org/example/checkout/service/CheckoutService.java` | Main service to modify |

### Files to Create

| Sub-Plan | New Files |
|----------|-----------|
| 054A | `libs/backend/shared-model/shared-model-order/` (9 model classes) |
| 054B | `libs/backend/platform/platform-events/` (6 classes) |
| 054C | `apps/checkout-service/.../CheckoutTransactionEntity.java`, `EventRetryScheduler.java`, etc. |
| 054D | `apps/order-service/.../consumer/OrderEventConsumer.java`, etc. |

---

## Verification Criteria

After all sub-plans complete:

1. **Build passes:** `pnpm nx run-many -t build`
2. **Tests pass:** `pnpm nx run-many -t test`
3. **Integration test:** Start services, complete checkout, verify order appears in order-service
4. **No order APIs in checkout:** `GET /orders/*` returns 404 from checkout-service
5. **Event published:** Redis stream `orders:completed` contains CloudEvent after checkout
6. **Order persisted:** order-service database contains order from event
