# shared-model-order

Shared domain models for order-related data, used by checkout-service and order-service.

## Package Structure

```
org.example.model.order/
├── Order.java           # Main order aggregate
├── OrderLineItem.java   # Line item with computed lineTotal
├── OrderStatus.java     # Order lifecycle states
├── PaymentStatus.java   # Payment states
├── FulfillmentType.java # DELIVERY, PICKUP, IMMEDIATE
├── FulfillmentDetails.java
├── DeliveryAddress.java
├── CustomerSnapshot.java
└── AppliedDiscount.java
```

## Design Principles

1. **Immutable records** - All models are Java records (immutable by design)
2. **No JPA annotations** - These are pure DTOs; entity mapping stays in services
3. **Jackson-friendly** - Annotated for JSON serialization in CloudEvents
4. **Builder pattern** - Order uses builder for convenient construction

## Usage

```java
// Building an order
Order order = Order.builder()
    .id(UUID.randomUUID())
    .storeNumber(100)
    .orderNumber("ORD-001")
    .grandTotal(new BigDecimal("99.99"))
    .status(OrderStatus.PAID)
    .build();

// Line item with computed total
OrderLineItem item = OrderLineItem.create(
    "prod-123", "SKU-001", "Widget",
    2, new BigDecimal("25.00"), BigDecimal.ZERO);
BigDecimal total = item.lineTotal(); // 50.00
```

## Consumers

- `checkout-service` - Creates orders and publishes events
- `order-service` - Consumes events and persists orders
- `platform-events` - Serializes Order in CloudEvent data payload
