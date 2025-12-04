# Audit

## Boundaries
Files requiring careful review: AuditEvent.java (changing structure affects future audit storage schema)

## Conventions
- All audit events use AuditEvent.cartEvent() factory method
- Event types follow ENTITY_ACTION pattern (e.g., CART_CREATED, PRODUCT_ADDED)
- Publishers must be non-blocking and return Mono<Void>
- Request context propagates via Reactor Context, not method parameters

## Warnings
- No-op implementation is temporary; real publisher will integrate with audit storage (see 009_AUDIT_DATA.md)
- Audit events must not block cart operations; use fire-and-forget pattern
- Changing event structure requires coordination with audit storage team
