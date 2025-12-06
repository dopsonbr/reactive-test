# Fulfillment Service

Fulfillment and shipping stub service for checkout integration testing.

## Purpose

Provides hardcoded fulfillment responses for address validation, shipping options, fulfillment planning, and inventory reservation. Acts as a stub service for checkout flow integration testing.

## Behavior

Returns deterministic stub responses for all fulfillment operations. Address validation always succeeds with standardized format, shipping options return fixed pricing, and fulfillment reservations are acknowledged without actual inventory tracking.

## Features

- **Address Validation**: Validates and standardizes delivery addresses
- **Shipping Options**: Returns available shipping methods with pricing
- **Fulfillment Planning**: Creates fulfillment plans with warehouse assignments
- **Inventory Reservation**: Reserves inventory for checkout (stub implementation)
- **Cost Calculation**: Calculates fulfillment costs based on shipping method

## API Endpoints

All endpoints require the following headers:

| Header | Required | Format | Description |
|--------|----------|--------|-------------|
| x-store-number | Yes | 1-2000 | Store context |
| x-order-number | Yes | UUID | Order correlation |
| x-userid | Yes | 6 alphanumeric | User identifier |
| x-sessionid | Yes | UUID | Session correlation |

### Address Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/address/validate` | Validate and standardize address |

### Shipping Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/shipping/options` | Get available shipping options with pricing |

### Fulfillment Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/fulfillments/calculate` | Calculate fulfillment cost |
| POST | `/fulfillments/plan` | Create fulfillment plan |
| POST | `/fulfillments/reserve` | Reserve inventory for order |

## Request/Response Examples

### Validate Address

```http
POST /address/validate
Content-Type: application/json

{
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "US"
}
```

**Response:**
```json
{
  "valid": true,
  "standardizedAddress": {
    "street": "123 MAIN ST",
    "city": "NEW YORK",
    "state": "NY",
    "zipCode": "10001-0000",
    "country": "US"
  }
}
```

### Get Shipping Options

```http
GET /shipping/options
```

**Response:**
```json
{
  "options": [
    {"code": "STANDARD", "name": "Standard Shipping", "cost": 5.99, "estimatedDays": 5},
    {"code": "EXPRESS", "name": "Express Shipping", "cost": 12.99, "estimatedDays": 2},
    {"code": "PICKUP", "name": "Store Pickup", "cost": 0.00, "estimatedDays": 1}
  ]
}
```

### Create Fulfillment Plan

```http
POST /fulfillments/plan
Content-Type: application/json

{
  "cartId": "cart-uuid",
  "items": [
    {"sku": "SKU123", "quantity": 2}
  ],
  "shippingMethod": "STANDARD",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  }
}
```

### Reserve Inventory

```http
POST /fulfillments/reserve
Content-Type: application/json

{
  "orderId": "order-uuid",
  "planId": "plan-uuid"
}
```

## Architecture

```
Controllers (Address, Fulfillment, Shipping)
                  ↓
           FulfillmentService
                  ↓
         Hardcoded Responses (Stub)
```

## Configuration

```yaml
server:
  port: 8085
```

## Running

### Local Development

```bash
# Run with Gradle
./gradlew :apps:fulfillment-service:bootRun
```

### Docker Compose

```bash
# Build JAR
./gradlew :apps:fulfillment-service:bootJar

# Start full stack
cd docker && docker compose up -d
```

## Testing

```bash
# Run all tests
./gradlew :apps:fulfillment-service:test
```

## Observability

### Metrics
```http
GET /actuator/prometheus
```

### Health
```http
GET /actuator/health
```

## Package Structure

```
org.example.fulfillment/
├── FulfillmentServiceApplication.java
├── controller/
│   ├── AddressController.java
│   ├── FulfillmentController.java
│   └── ShippingController.java
├── dto/
│   ├── AddressValidationRequest.java
│   ├── AddressValidationResponse.java
│   ├── FulfillmentCostRequest.java
│   ├── FulfillmentCostResponse.java
│   ├── FulfillmentPlanRequest.java
│   ├── FulfillmentPlanResponse.java
│   ├── ReservationRequest.java
│   ├── ReservationResponse.java
│   ├── ShippingOption.java
│   └── ShippingOptionsResponse.java
└── service/
    └── FulfillmentService.java
```

## Quirks

- This is a **stub service** - all responses are hardcoded for testing
- Address validation always returns valid with standardized format
- Shipping costs are fixed regardless of cart contents or destination
- Inventory reservations are acknowledged but not tracked
- No actual warehouse or inventory integration
