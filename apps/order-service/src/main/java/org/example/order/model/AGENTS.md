# order.model

## Boundaries
Files requiring careful review: Order.java (builder pattern), all enum files (state transitions)

## Conventions
- All models are immutable Java records
- Order uses builder pattern for construction
- Status enums define valid states; transition logic lives in service layer
- Denormalized fields (CustomerSnapshot, OrderLineItem) capture point-in-time data at checkout

## Warnings
- Never modify record fields directly; use builder or convenience methods like withStatus()
- FulfillmentDetails may be null for IMMEDIATE orders
- DeliveryAddress only applies when FulfillmentType is DELIVERY
- Do not add business logic to model classes; keep them as pure data containers
