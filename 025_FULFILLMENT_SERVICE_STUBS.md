# 025_FULFILLMENT_SERVICE_STUBS

**Status: DRAFT**

---

## Overview

Expand fulfillment-service with stub endpoints to support checkout-service implementation. This adds stubbed APIs for fulfillment plans, reservations, address validation, and shipping options—all returning hardcoded responses suitable for checkout integration testing.

## Goals

1. Provide stub endpoints for checkout-service to call during development
2. Define the fulfillment API contract for future implementation
3. Maintain consistency with existing codebase patterns (DTOs, controllers, structured logging)
4. Keep implementation minimal—stubs only, no real business logic

## References

**Standards:**
- `docs/standards/backend/architecture.md` - Package structure and layering
- `docs/standards/backend/models.md` - DTO record patterns

**Templates:**
- `docs/templates/backend/_template_controller.md` - Controller implementation pattern

## Architecture

```
┌─────────────────────┐         ┌─────────────────────────────┐
│  checkout-service   │ ──────► │    fulfillment-service      │
│  (future consumer)  │         │                             │
└─────────────────────┘         │  POST /fulfillments/plan    │
                                │  POST /fulfillments/reserve │
┌─────────────────────┐         │  POST /address/validate     │
│    cart-service     │ ──────► │  GET  /shipping/options     │
│  (existing consumer)│         │  POST /fulfillments/calculate│
└─────────────────────┘         └─────────────────────────────┘
```

### Package Structure

```
org.example.fulfillment/
├── FulfillmentServiceApplication.java  (existing)
├── controller/
│   ├── FulfillmentController.java      (MODIFY - extract DTOs)
│   ├── AddressController.java          (CREATE)
│   └── ShippingController.java         (CREATE)
├── dto/                                (CREATE package)
│   ├── FulfillmentCostRequest.java
│   ├── FulfillmentCostResponse.java
│   ├── FulfillmentPlanRequest.java
│   ├── FulfillmentPlanResponse.java
│   ├── ReservationRequest.java
│   ├── ReservationResponse.java
│   ├── AddressValidationRequest.java
│   ├── AddressValidationResponse.java
│   ├── ShippingOption.java
│   └── ShippingOptionsResponse.java
└── service/                            (CREATE package)
    └── FulfillmentService.java         (stub service layer)
```

### Package Naming

| Module | Package |
|--------|---------|
| DTOs | `org.example.fulfillment.dto` |
| Controllers | `org.example.fulfillment.controller` |
| Service | `org.example.fulfillment.service` |

---

## Phase 1: Create DTO Package

**Prereqs:** None
**Blockers:** None

### 1.1 Extract Existing DTOs from Controller

**Files:**
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/dto/FulfillmentCostRequest.java`
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/dto/FulfillmentCostResponse.java`
- MODIFY: `apps/fulfillment-service/src/main/java/org/example/fulfillment/controller/FulfillmentController.java`

**Implementation:**

`FulfillmentCostRequest.java`:
```java
package org.example.fulfillment.dto;

import java.util.List;
import org.example.model.fulfillment.FulfillmentType;

public record FulfillmentCostRequest(FulfillmentType type, List<Long> skus) {}
```

`FulfillmentCostResponse.java`:
```java
package org.example.fulfillment.dto;

public record FulfillmentCostResponse(String cost) {}
```

Update `FulfillmentController.java` to import from `dto` package and remove inline records.

### 1.2 Create Fulfillment Plan DTOs

**Files:**
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/dto/FulfillmentPlanRequest.java`
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/dto/FulfillmentPlanResponse.java`

**Implementation:**

`FulfillmentPlanRequest.java`:
```java
package org.example.fulfillment.dto;

import java.util.List;
import org.example.model.fulfillment.FulfillmentType;

public record FulfillmentPlanRequest(
    String cartId,
    FulfillmentType type,
    List<Long> skus,
    String destinationZipCode
) {}
```

`FulfillmentPlanResponse.java`:
```java
package org.example.fulfillment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record FulfillmentPlanResponse(
    String planId,
    String status,
    BigDecimal estimatedCost,
    LocalDate estimatedDeliveryDate,
    List<FulfillmentLineItem> lineItems
) {
    public record FulfillmentLineItem(
        Long sku,
        String fulfillmentMethod,
        String sourceLocation
    ) {}
}
```

### 1.3 Create Reservation DTOs

**Files:**
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/dto/ReservationRequest.java`
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/dto/ReservationResponse.java`

**Implementation:**

`ReservationRequest.java`:
```java
package org.example.fulfillment.dto;

public record ReservationRequest(
    String planId,
    String cartId,
    int ttlMinutes
) {}
```

`ReservationResponse.java`:
```java
package org.example.fulfillment.dto;

import java.time.Instant;

public record ReservationResponse(
    String reservationId,
    String planId,
    String status,
    Instant expiresAt
) {}
```

### 1.4 Create Address Validation DTOs

**Files:**
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/dto/AddressValidationRequest.java`
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/dto/AddressValidationResponse.java`

**Implementation:**

`AddressValidationRequest.java`:
```java
package org.example.fulfillment.dto;

public record AddressValidationRequest(
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String zipCode,
    String country
) {}
```

`AddressValidationResponse.java`:
```java
package org.example.fulfillment.dto;

public record AddressValidationResponse(
    boolean valid,
    boolean deliverable,
    String normalizedAddress,
    String validationMessage
) {}
```

### 1.5 Create Shipping Options DTOs

**Files:**
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/dto/ShippingOption.java`
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/dto/ShippingOptionsResponse.java`

**Implementation:**

`ShippingOption.java`:
```java
package org.example.fulfillment.dto;

import java.math.BigDecimal;

public record ShippingOption(
    String optionId,
    String name,
    String description,
    BigDecimal cost,
    int estimatedDaysMin,
    int estimatedDaysMax
) {}
```

`ShippingOptionsResponse.java`:
```java
package org.example.fulfillment.dto;

import java.util.List;

public record ShippingOptionsResponse(List<ShippingOption> options) {}
```

---

## Phase 2: Create Stub Service Layer

**Prereqs:** Phase 1 complete (DTOs exist)
**Blockers:** None

### 2.1 Create FulfillmentService

**Files:**
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/service/FulfillmentService.java`

**Implementation:**

```java
package org.example.fulfillment.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.example.fulfillment.dto.*;
import org.example.model.fulfillment.FulfillmentType;
import org.example.platform.logging.StructuredLogger;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class FulfillmentService {

    private static final StructuredLogger log = StructuredLogger.getLogger(FulfillmentService.class);

    public Mono<FulfillmentCostResponse> calculateCost(FulfillmentCostRequest request) {
        return Mono.deferContextual(ctx -> {
            BigDecimal cost = switch (request.type()) {
                case DELIVERY -> new BigDecimal("9.99");
                case PICKUP -> BigDecimal.ZERO;
                case INSTALLATION -> new BigDecimal("49.99");
            };
            log.info("Calculated fulfillment cost", "type", request.type(), "cost", cost);
            return Mono.just(new FulfillmentCostResponse(cost.toString()));
        });
    }

    public Mono<FulfillmentPlanResponse> createPlan(FulfillmentPlanRequest request) {
        return Mono.deferContextual(ctx -> {
            String planId = "PLAN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            List<FulfillmentPlanResponse.FulfillmentLineItem> lineItems = request.skus().stream()
                .map(sku -> new FulfillmentPlanResponse.FulfillmentLineItem(
                    sku,
                    request.type().name(),
                    "WAREHOUSE-001"
                ))
                .toList();

            log.info("Created fulfillment plan", "planId", planId, "cartId", request.cartId());

            return Mono.just(new FulfillmentPlanResponse(
                planId,
                "CREATED",
                new BigDecimal("9.99"),
                LocalDate.now().plusDays(5),
                lineItems
            ));
        });
    }

    public Mono<ReservationResponse> createReservation(ReservationRequest request) {
        return Mono.deferContextual(ctx -> {
            String reservationId = "RES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            Instant expiresAt = Instant.now().plusSeconds(request.ttlMinutes() * 60L);

            log.info("Created reservation", "reservationId", reservationId, "planId", request.planId());

            return Mono.just(new ReservationResponse(
                reservationId,
                request.planId(),
                "RESERVED",
                expiresAt
            ));
        });
    }

    public Mono<AddressValidationResponse> validateAddress(AddressValidationRequest request) {
        return Mono.deferContextual(ctx -> {
            // Stub: all addresses are valid and deliverable
            String normalized = String.format("%s, %s, %s %s",
                request.addressLine1(),
                request.city(),
                request.state(),
                request.zipCode()
            );

            log.info("Validated address", "zipCode", request.zipCode(), "valid", true);

            return Mono.just(new AddressValidationResponse(
                true,
                true,
                normalized,
                "Address validated successfully"
            ));
        });
    }

    public Mono<ShippingOptionsResponse> getShippingOptions(String zipCode) {
        return Mono.deferContextual(ctx -> {
            List<ShippingOption> options = List.of(
                new ShippingOption("STANDARD", "Standard Shipping", "5-7 business days",
                    new BigDecimal("5.99"), 5, 7),
                new ShippingOption("EXPRESS", "Express Shipping", "2-3 business days",
                    new BigDecimal("12.99"), 2, 3),
                new ShippingOption("OVERNIGHT", "Overnight Shipping", "Next business day",
                    new BigDecimal("24.99"), 1, 1)
            );

            log.info("Retrieved shipping options", "zipCode", zipCode, "optionCount", options.size());

            return Mono.just(new ShippingOptionsResponse(options));
        });
    }
}
```

---

## Phase 3: Update Controllers

**Prereqs:** Phase 1 and Phase 2 complete
**Blockers:** None

### 3.1 Update FulfillmentController

**Files:**
- MODIFY: `apps/fulfillment-service/src/main/java/org/example/fulfillment/controller/FulfillmentController.java`

**Implementation:**

```java
package org.example.fulfillment.controller;

import org.example.fulfillment.dto.*;
import org.example.fulfillment.service.FulfillmentService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/fulfillments")
public class FulfillmentController {

    private final FulfillmentService fulfillmentService;

    public FulfillmentController(FulfillmentService fulfillmentService) {
        this.fulfillmentService = fulfillmentService;
    }

    @PostMapping("/calculate")
    public Mono<FulfillmentCostResponse> calculateCost(@RequestBody FulfillmentCostRequest request) {
        return fulfillmentService.calculateCost(request);
    }

    @PostMapping("/plan")
    public Mono<FulfillmentPlanResponse> createPlan(@RequestBody FulfillmentPlanRequest request) {
        return fulfillmentService.createPlan(request);
    }

    @PostMapping("/reserve")
    public Mono<ReservationResponse> createReservation(@RequestBody ReservationRequest request) {
        return fulfillmentService.createReservation(request);
    }
}
```

### 3.2 Create AddressController

**Files:**
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/controller/AddressController.java`

**Implementation:**

```java
package org.example.fulfillment.controller;

import org.example.fulfillment.dto.AddressValidationRequest;
import org.example.fulfillment.dto.AddressValidationResponse;
import org.example.fulfillment.service.FulfillmentService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/address")
public class AddressController {

    private final FulfillmentService fulfillmentService;

    public AddressController(FulfillmentService fulfillmentService) {
        this.fulfillmentService = fulfillmentService;
    }

    @PostMapping("/validate")
    public Mono<AddressValidationResponse> validateAddress(@RequestBody AddressValidationRequest request) {
        return fulfillmentService.validateAddress(request);
    }
}
```

### 3.3 Create ShippingController

**Files:**
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/controller/ShippingController.java`

**Implementation:**

```java
package org.example.fulfillment.controller;

import org.example.fulfillment.dto.ShippingOptionsResponse;
import org.example.fulfillment.service.FulfillmentService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/shipping")
public class ShippingController {

    private final FulfillmentService fulfillmentService;

    public ShippingController(FulfillmentService fulfillmentService) {
        this.fulfillmentService = fulfillmentService;
    }

    @GetMapping("/options")
    public Mono<ShippingOptionsResponse> getShippingOptions(
            @RequestParam(defaultValue = "00000") String zipCode) {
        return fulfillmentService.getShippingOptions(zipCode);
    }
}
```

---

## Phase 4: Add Unit Tests

**Prereqs:** Phases 1-3 complete
**Blockers:** None

### 4.1 Create Service Tests

**Files:**
- CREATE: `apps/fulfillment-service/src/test/java/org/example/fulfillment/service/FulfillmentServiceTest.java`

**Implementation:**

Test all stub methods return expected hardcoded values using StepVerifier.

### 4.2 Create Controller Tests

**Files:**
- CREATE: `apps/fulfillment-service/src/test/java/org/example/fulfillment/controller/FulfillmentControllerTest.java`
- CREATE: `apps/fulfillment-service/src/test/java/org/example/fulfillment/controller/AddressControllerTest.java`
- CREATE: `apps/fulfillment-service/src/test/java/org/example/fulfillment/controller/ShippingControllerTest.java`

**Implementation:**

Use `@WebFluxTest` to test each controller endpoint returns expected responses.

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `dto/FulfillmentCostRequest.java` | Cost calculation request |
| CREATE | `dto/FulfillmentCostResponse.java` | Cost calculation response |
| CREATE | `dto/FulfillmentPlanRequest.java` | Plan creation request |
| CREATE | `dto/FulfillmentPlanResponse.java` | Plan creation response |
| CREATE | `dto/ReservationRequest.java` | Reservation request |
| CREATE | `dto/ReservationResponse.java` | Reservation response |
| CREATE | `dto/AddressValidationRequest.java` | Address validation request |
| CREATE | `dto/AddressValidationResponse.java` | Address validation response |
| CREATE | `dto/ShippingOption.java` | Shipping option model |
| CREATE | `dto/ShippingOptionsResponse.java` | Shipping options response |
| CREATE | `service/FulfillmentService.java` | Stub business logic |
| MODIFY | `controller/FulfillmentController.java` | Update to use service/DTOs |
| CREATE | `controller/AddressController.java` | Address validation endpoint |
| CREATE | `controller/ShippingController.java` | Shipping options endpoint |
| CREATE | `service/FulfillmentServiceTest.java` | Service unit tests |
| CREATE | `controller/FulfillmentControllerTest.java` | Controller tests |
| CREATE | `controller/AddressControllerTest.java` | Controller tests |
| CREATE | `controller/ShippingControllerTest.java` | Controller tests |

---

## API Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/fulfillments/calculate` | Calculate fulfillment cost (existing) |
| POST | `/fulfillments/plan` | Create fulfillment plan |
| POST | `/fulfillments/reserve` | Reserve inventory for fulfillment |
| POST | `/address/validate` | Validate shipping address |
| GET | `/shipping/options?zipCode=` | Get available shipping options |

---

## Checklist

- [ ] Phase 1: DTO package created with all request/response records
- [ ] Phase 2: FulfillmentService with stub implementations
- [ ] Phase 3: Controllers updated/created to use service layer
- [ ] Phase 4: Unit tests for service and controllers
- [ ] All tests passing (`pnpm nx test :apps:fulfillment-service`)
