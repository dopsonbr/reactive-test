# order.model

## Purpose
Represents immutable order domain models for order capture, fulfillment tracking, and denormalized analytics extraction.

## Behavior
Order serves as the aggregate root containing line items, applied discounts, customer snapshot, and fulfillment details. All models use Java records for immutability. Order provides builder pattern for construction and convenience methods for status transitions.

## Quirks
- CustomerSnapshot and OrderLineItem are denormalized copies from source systems, captured at checkout time
- Status transitions (OrderStatus, PaymentStatus) follow state machine rules enforced at service layer
- FulfillmentDetails is optional; only populated for WILL_CALL and DELIVERY types
