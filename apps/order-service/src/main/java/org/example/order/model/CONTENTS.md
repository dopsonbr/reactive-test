# Contents

| File | Description |
|------|-------------|
| `Order.java` | Aggregate root containing order details, line items, discounts, customer snapshot, and fulfillment info |
| `OrderLineItem.java` | Denormalized product line item with quantity, pricing, and discounts |
| `OrderStatus.java` | Order lifecycle states (CREATED, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED) |
| `PaymentStatus.java` | Payment states (PENDING, AUTHORIZED, CAPTURED, REFUNDED, FAILED) |
| `FulfillmentType.java` | Fulfillment method (IMMEDIATE, WILL_CALL, DELIVERY) |
| `FulfillmentDetails.java` | Fulfillment metadata including delivery address, pickup location, tracking number |
| `AppliedDiscount.java` | Discount applied at checkout with code, type, and amount |
| `CustomerSnapshot.java` | Denormalized customer info captured at order creation |
| `DeliveryAddress.java` | Shipping address for delivery orders |
