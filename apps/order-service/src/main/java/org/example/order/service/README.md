# Service

## Purpose
Provides read and update operations for orders created by checkout-service.

## Behavior
OrderService acts as a business logic layer between controllers and the order repository. It enforces order status state machine rules, validates transitions, and provides flexible query capabilities through OrderSearchCriteria. All operations return reactive types (Mono/Flux) and throw ResponseStatusException on validation failures or not-found conditions.

## Quirks
- Orders can only be cancelled in CREATED, CONFIRMED, or PROCESSING states
- Status transitions follow a strict state machine (CREATED → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → REFUNDED)
- CANCELLED and REFUNDED are terminal states with no valid outbound transitions
- OrderSearchCriteria defaults: startDate=EPOCH, endDate=now, limit=50, offset=0
