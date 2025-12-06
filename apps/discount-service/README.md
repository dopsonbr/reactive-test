# Discount Service

Discount pricing engine with promo codes, employee markdowns, and loyalty tier benefits.

## Purpose

Provides centralized discount calculation and validation for the e-commerce platform. Manages promotional discounts (auto-apply and promo codes), employee markdown authorization, and loyalty-based pricing benefits.

## Behavior

Exposes three REST APIs: discount validation and calculation, employee markdown management, and comprehensive cart pricing. Validates promo codes against store context, authorizes employee-only markdowns based on user permissions, and computes best-price scenarios considering loyalty tiers and stackable discounts.

## Features

- **Promo Codes**: Validate and apply promotional discount codes by store
- **Auto-Apply Discounts**: Automatic discounts applied based on cart conditions
- **Employee Markdowns**: Manager-authorized price reductions with 4-hour expiration
- **Loyalty Pricing**: Tier-based benefits (BRONZE, SILVER, GOLD, PLATINUM)
- **Price Calculation**: Comprehensive cart pricing with discount stacking rules
- **In-Memory Storage**: Development-ready repositories (production requires persistence)

## API Endpoints

All endpoints require the following headers:

| Header | Required | Format | Description |
|--------|----------|--------|-------------|
| x-store-number | Yes | 1-2000 | Store context |
| x-order-number | Yes | UUID | Order correlation |
| x-userid | Yes | 6 alphanumeric | User identifier |
| x-sessionid | Yes | UUID | Session correlation |

### Discount Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/discounts/validate?code={code}` | Validate promo code |
| GET | `/discounts/active?storeNumber={n}` | Get active discounts for store |
| POST | `/discounts/calculate` | Calculate discount for cart |

### Markdown Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/markdowns/apply` | Apply employee markdown (requires ADMIN permission) |
| GET | `/markdowns/{markdownId}` | Get markdown by ID |
| DELETE | `/markdowns/{markdownId}` | Void markdown |

### Pricing Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/pricing/calculate` | Calculate best price with all discounts and loyalty |

## Request/Response Examples

### Validate Promo Code

```http
GET /discounts/validate?code=SAVE10&storeNumber=100
```

### Apply Employee Markdown

```http
POST /markdowns/apply
Content-Type: application/json
x-userid: MGR001

{
  "cartId": "cart-uuid",
  "itemSku": "SKU123",
  "markdownPercentage": 15,
  "reason": "Customer loyalty"
}
```

### Calculate Best Price

```http
POST /pricing/calculate
Content-Type: application/json

{
  "storeNumber": 100,
  "customerId": "cust-123",
  "items": [
    {"sku": "SKU123", "description": "Widget", "quantity": 2, "unitPrice": 29.99}
  ],
  "promoCodes": ["SAVE10"],
  "shippingOption": "STANDARD"
}
```

## Architecture

```
Controllers (Discount, Markdown, Pricing)
                  ↓
        DiscountRequestValidator
                  ↓
    ┌─────────────┼─────────────┐
    ↓             ↓             ↓
DiscountService  MarkdownService  PricingService
    ↓             ↓             ↓
    └─────────────┼─────────────┘
                  ↓
      ┌───────────┼───────────┐
      ↓           ↓           ↓
DiscountRepo  MarkdownRepo  CustomerRepo/UserRepo
(in-memory)   (in-memory)   (external services)
```

## Discount Stacking Rules

- **Stackable discounts**: Sum all applicable stackable discounts
- **Non-stackable discounts**: Use single best non-stackable discount
- **Never both**: Either sum stackable OR use best non-stackable
- **Loyalty first**: Apply loyalty tier benefits before promo codes

## Configuration

```yaml
server:
  port: 8084
```

## Running

### Local Development

```bash
# Run with Gradle
./gradlew :apps:discount-service:bootRun
```

### Docker Compose

```bash
# Build JAR
./gradlew :apps:discount-service:bootJar

# Start full stack
cd docker && docker compose up -d
```

## Testing

```bash
# Run all tests
./gradlew :apps:discount-service:test
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
org.example.discount/
├── DiscountServiceApplication.java
├── controller/
│   ├── DiscountController.java
│   ├── MarkdownController.java
│   ├── PricingController.java
│   └── dto/
│       ├── ApplyMarkdownRequest.java
│       ├── CartItem.java
│       ├── PricingRequest.java
│       └── ShippingOption.java
├── domain/
│   ├── LoyaltyInfo.java
│   └── UserContext.java
├── exception/
│   ├── InvalidDiscountException.java
│   └── UnauthorizedMarkdownException.java
├── repository/
│   ├── DiscountRepository.java
│   ├── InMemoryDiscountRepository.java
│   ├── InMemoryMarkdownRepository.java
│   ├── MarkdownRepository.java
│   ├── customer/
│   │   └── CustomerRepository.java
│   └── user/
│       └── UserRepository.java
├── service/
│   ├── DiscountService.java
│   ├── MarkdownService.java
│   └── PricingService.java
└── validation/
    └── DiscountRequestValidator.java
```
