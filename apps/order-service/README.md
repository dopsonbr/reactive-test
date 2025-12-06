# Order Service

Order service provides read and update access to sold orders created by checkout-service. Implements order search endpoints, dual REST/GraphQL APIs for viewing orders, and GraphQL mutations for order updates.

## Port

- **8088**

## Features

- Search orders by store, customer, status, date range
- View individual orders via REST and GraphQL
- Update orders via GraphQL mutations (status, fulfillment, notes)
- Shares database with checkout-service (read/update only, no inserts)

## REST Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/orders/{orderId}` | Get order by ID |
| GET | `/orders/number/{orderNumber}` | Get order by order number |
| GET | `/orders` | Search orders (query params) |
| GET | `/orders/store/{storeNumber}` | List orders by store |
| GET | `/orders/customer/{customerId}` | List orders by customer |

## GraphQL Operations

### Queries
- `order(id: ID!)` - Get order by ID
- `orderByNumber(orderNumber: String!)` - Get order by order number
- `orders(storeNumber: Int!, status: OrderStatus, limit: Int, offset: Int)` - List orders
- `ordersByCustomer(customerId: String!)` - List orders by customer
- `searchOrders(input: OrderSearchInput!)` - Search orders with filters

### Mutations
- `updateOrderStatus(id: ID!, status: OrderStatus!)` - Update order status
- `updateFulfillment(id: ID!, input: UpdateFulfillmentInput!)` - Update fulfillment details
- `cancelOrder(id: ID!, reason: String!)` - Cancel an order
- `addOrderNote(id: ID!, note: String!)` - Add note to order

## Security

Requires OAuth2 scopes:
- `order:read` - For all query operations
- `order:write` - For all mutation operations

## Database

Shares the `checkoutdb.orders` table with checkout-service. This service only reads and updates orders; it does not create new orders.

## Running

```bash
# Build
./gradlew :apps:order-service:build

# Run tests
./gradlew :apps:order-service:test

# Run locally
./gradlew :apps:order-service:bootRun

# Build Docker image
./gradlew :apps:order-service:bootJar
docker build -f docker/Dockerfile.order-service -t order-service .
```

## Configuration

Key environment variables:
- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name (default: checkoutdb)
- `DB_USERNAME` - Database user (default: checkout_user)
- `DB_PASSWORD` - Database password (default: checkout_pass)
