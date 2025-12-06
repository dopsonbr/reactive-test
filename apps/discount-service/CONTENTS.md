# Discount Service Contents

## Main Source (src/main/java/org/example/discount/)

| File | Description |
|------|-------------|
| `DiscountServiceApplication.java` | Spring Boot application entry point with platform package scanning |

### Controller Layer
| File | Description |
|------|-------------|
| `controller/DiscountController.java` | REST endpoints for discount validation and calculation |
| `controller/MarkdownController.java` | REST endpoints for employee markdown operations |
| `controller/PricingController.java` | REST endpoint for comprehensive cart pricing |
| `controller/dto/ApplyMarkdownRequest.java` | Request to apply employee markdown |
| `controller/dto/CartItem.java` | Cart item with SKU, description, quantity, price |
| `controller/dto/PricingRequest.java` | Comprehensive pricing request with items and context |
| `controller/dto/ShippingOption.java` | Enum for shipping options (STANDARD, EXPRESS, PICKUP) |

### Domain Layer
| File | Description |
|------|-------------|
| `domain/LoyaltyInfo.java` | Customer loyalty tier with points and benefits |
| `domain/UserContext.java` | User type and permissions for markdown authorization |

### Exception Layer
| File | Description |
|------|-------------|
| `exception/InvalidDiscountException.java` | Invalid or expired promo code (404 status) |
| `exception/UnauthorizedMarkdownException.java` | Insufficient markdown permissions (403 status) |

### Repository Layer
| File | Description |
|------|-------------|
| `repository/DiscountRepository.java` | Reactive repository interface for discounts |
| `repository/InMemoryDiscountRepository.java` | In-memory implementation with seeded data |
| `repository/InMemoryMarkdownRepository.java` | In-memory implementation for markdowns |
| `repository/MarkdownRepository.java` | Reactive repository interface for markdowns |
| `repository/customer/CustomerRepository.java` | Repository for customer loyalty data |
| `repository/user/UserRepository.java` | Repository for user context and permissions |

### Service Layer
| File | Description |
|------|-------------|
| `service/DiscountService.java` | Promo code validation and discount calculation |
| `service/MarkdownService.java` | Employee markdown authorization and lifecycle |
| `service/PricingService.java` | Best price calculation with discount stacking |

### Validation Layer
| File | Description |
|------|-------------|
| `validation/DiscountRequestValidator.java` | Request validation with error aggregation |

## Resources (src/main/resources/)

| File | Description |
|------|-------------|
| `application.yml` | Server configuration |

## Key Dependencies

| Dependency | Purpose |
|------------|---------|
| platform-logging | Structured JSON logging |
| platform-webflux | Context propagation |
| platform-error | Global error handling |
