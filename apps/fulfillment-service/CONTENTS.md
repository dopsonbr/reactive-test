# Fulfillment Service Contents

## Main Source (src/main/java/org/example/fulfillment/)

| File | Description |
|------|-------------|
| `FulfillmentServiceApplication.java` | Spring Boot application entry point with platform package scanning |

### Controller Layer
| File | Description |
|------|-------------|
| `controller/AddressController.java` | REST endpoint for address validation |
| `controller/FulfillmentController.java` | REST endpoints for fulfillment plan, cost, and reservation |
| `controller/ShippingController.java` | REST endpoint for shipping options |

### DTO Layer
| File | Description |
|------|-------------|
| `dto/AddressValidationRequest.java` | Request for address validation |
| `dto/AddressValidationResponse.java` | Response with validation result and standardized address |
| `dto/FulfillmentCostRequest.java` | Request for fulfillment cost calculation |
| `dto/FulfillmentCostResponse.java` | Response with calculated fulfillment cost |
| `dto/FulfillmentPlanRequest.java` | Request for fulfillment plan creation |
| `dto/FulfillmentPlanResponse.java` | Response with fulfillment plan details |
| `dto/ReservationRequest.java` | Request for inventory reservation |
| `dto/ReservationResponse.java` | Response with reservation confirmation |
| `dto/ShippingOption.java` | Shipping option with code, name, cost, and estimated days |
| `dto/ShippingOptionsResponse.java` | Response with available shipping options |

### Service Layer
| File | Description |
|------|-------------|
| `service/FulfillmentService.java` | Stub fulfillment business logic with hardcoded responses |

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
