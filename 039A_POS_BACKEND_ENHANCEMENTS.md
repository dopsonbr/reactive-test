# 039A_POS_BACKEND_ENHANCEMENTS

**Status: DRAFT**

---

## Overview

Backend API enhancements required to support the full-featured POS system, including expanded payment types, enhanced fulfillment options, customer search improvements, and markdown permission tiers.

**Related Plans:**
- `039_POS_SYSTEM.md` - Parent initiative
- `039C_POS_APP_SCAFFOLD.md` - Depends on these APIs

## Goals

1. Expand FulfillmentType enum to include WILL_CALL for scheduled pickups
2. Add payment type models for Card Not Present, Net Terms, Split Payment
3. Enhance customer search with full-text, autocomplete, and pagination
4. Implement markdown permission tiers with role-based limits
5. Add multi-fulfillment order support

---

## Phase 1: Fulfillment Enhancements

**Prereqs:** Existing fulfillment-service
**Blockers:** None

### 1.1 Add WILL_CALL Fulfillment Type

**Files:**
- MODIFY: `libs/backend/shared-model/shared-model-fulfillment/src/main/java/org/example/model/fulfillment/FulfillmentType.java`

**Implementation:**
```java
public enum FulfillmentType {
  DELIVERY,     // Ship to address
  PICKUP,       // Store pickup (same day or scheduled)
  WILL_CALL,    // Hold for customer with scheduled window
  INSTALLATION  // Professional installation
}
```

### 1.2 Add Fulfillment Slots Endpoint

**Files:**
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/controller/FulfillmentSlotsController.java`
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/dto/FulfillmentSlot.java`
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/dto/FulfillmentSlotsRequest.java`
- CREATE: `apps/fulfillment-service/src/main/java/org/example/fulfillment/dto/FulfillmentSlotsResponse.java`

**Implementation:**
```java
@GetMapping("/fulfillments/slots")
public Mono<FulfillmentSlotsResponse> getSlots(
    @RequestParam FulfillmentType type,
    @RequestParam int storeNumber,
    @RequestParam @DateTimeFormat(iso = DATE) LocalDate startDate,
    @RequestParam @DateTimeFormat(iso = DATE) LocalDate endDate
) {
  // Returns available slots for the requested fulfillment type
  // Each slot has: date, time window, capacity remaining
}
```

**Slot Model:**
```java
record FulfillmentSlot(
    LocalDate date,
    LocalTime startTime,
    LocalTime endTime,
    int capacityRemaining,
    boolean isAvailable
)
```

### 1.3 Multi-Fulfillment Order Support

**Files:**
- CREATE: `apps/checkout-service/src/main/java/org/example/checkout/dto/MultiFulfillmentRequest.java`
- MODIFY: `apps/checkout-service/src/main/java/org/example/checkout/dto/InitiateCheckoutRequest.java`
- MODIFY: `apps/checkout-service/src/main/java/org/example/checkout/service/CheckoutService.java`

**Implementation:**
```java
record MultiFulfillmentRequest(
    List<FulfillmentGroup> groups
)

record FulfillmentGroup(
    FulfillmentType type,
    LocalDate scheduledDate,
    String timeSlotId,
    DeliveryAddress address,  // null for PICKUP/WILL_CALL
    String instructions,
    List<String> skus         // Items in this fulfillment group
)
```

---

## Phase 2: Payment Type Expansion

**Prereqs:** Existing checkout-service
**Blockers:** None

### 2.1 Payment Type Models

**Files:**
- CREATE: `libs/backend/shared-model/shared-model-payment/build.gradle.kts`
- CREATE: `libs/backend/shared-model/shared-model-payment/src/main/java/org/example/model/payment/PaymentType.java`
- CREATE: `libs/backend/shared-model/shared-model-payment/src/main/java/org/example/model/payment/PaymentMethod.java`
- CREATE: `libs/backend/shared-model/shared-model-payment/src/main/java/org/example/model/payment/CardPayment.java`
- CREATE: `libs/backend/shared-model/shared-model-payment/src/main/java/org/example/model/payment/CardNotPresentPayment.java`
- CREATE: `libs/backend/shared-model/shared-model-payment/src/main/java/org/example/model/payment/NetTermsPayment.java`
- CREATE: `libs/backend/shared-model/shared-model-payment/src/main/java/org/example/model/payment/WalletPayment.java`
- CREATE: `libs/backend/shared-model/shared-model-payment/src/main/java/org/example/model/payment/CashPayment.java`
- CREATE: `libs/backend/shared-model/shared-model-payment/src/main/java/org/example/model/payment/GiftCardPayment.java`
- CREATE: `libs/backend/shared-model/shared-model-payment/src/main/java/org/example/model/payment/SplitPayment.java`
- MODIFY: `settings.gradle.kts` - Add new module

**Implementation:**
```java
public enum PaymentType {
  CARD_PRESENT,       // In-store swipe/tap/insert
  CARD_NOT_PRESENT,   // Manual entry (phone orders)
  WALLET,             // Customer stored payment
  NET_TERMS,          // B2B invoice (30/60/90 days)
  CASH,               // Cash payment
  CHECK,              // Business check
  GIFT_CARD,          // Prepaid gift card
  SPLIT               // Multiple payment methods
}

public sealed interface PaymentMethod permits
    CardPayment, CardNotPresentPayment, NetTermsPayment,
    WalletPayment, CashPayment, GiftCardPayment, SplitPayment {}

record CardPayment(
    String terminalId,
    String authorizationCode,
    String cardBrand,
    String lastFour,
    boolean isDebit
) implements PaymentMethod {}

record CardNotPresentPayment(
    String cardToken,  // Tokenized for PCI compliance
    String cardBrand,
    String lastFour,
    String expiryMonth,
    String expiryYear,
    String billingZip
) implements PaymentMethod {}

record NetTermsPayment(
    int termsDays,           // 30, 60, 90
    String purchaseOrderNumber,
    String approvedBy        // B2B approver
) implements PaymentMethod {}

record SplitPayment(
    List<PaymentMethod> methods,
    List<BigDecimal> amounts
) implements PaymentMethod {}
```

### 2.2 Update Checkout Service

**Files:**
- MODIFY: `apps/checkout-service/src/main/java/org/example/checkout/dto/CompleteCheckoutRequest.java`
- MODIFY: `apps/checkout-service/src/main/java/org/example/checkout/service/CheckoutService.java`
- MODIFY: `apps/checkout-service/src/main/java/org/example/checkout/client/PaymentGatewayClient.java`

**Implementation:**
Update to accept polymorphic payment methods:
```java
record CompleteCheckoutRequest(
    String checkoutId,
    PaymentType paymentType,
    PaymentMethod paymentMethod,  // Sealed interface
    BigDecimal amount
)
```

---

## Phase 3: Customer Search Enhancement

**Prereqs:** Existing customer-service
**Blockers:** None

### 3.1 Enhanced Search Endpoint

**Files:**
- MODIFY: `apps/customer-service/src/main/java/org/example/customer/controller/CustomerController.java`
- CREATE: `apps/customer-service/src/main/java/org/example/customer/dto/CustomerSearchResponse.java`
- MODIFY: `apps/customer-service/src/main/java/org/example/customer/service/CustomerService.java`

**Implementation:**
```java
@GetMapping("/customers/search")
public Mono<CustomerSearchResponse> searchCustomers(
    @RequestParam(required = false) String q,           // Full-text query
    @RequestParam(required = false) String email,       // Exact email
    @RequestParam(required = false) String phone,       // Exact phone
    @RequestParam(required = false) String customerId,  // Exact ID
    @RequestParam(required = false) CustomerType type,  // CONSUMER or BUSINESS
    @RequestParam(required = false) LoyaltyTier tier,   // Loyalty tier filter
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(defaultValue = "name") String sortBy,
    @RequestParam(defaultValue = "ASC") String sortDirection
)

record CustomerSearchResponse(
    List<Customer> customers,
    int totalCount,
    int page,
    int pageSize,
    int totalPages
)
```

### 3.2 Autocomplete Endpoint

**Files:**
- CREATE: `apps/customer-service/src/main/java/org/example/customer/controller/CustomerAutocompleteController.java`
- CREATE: `apps/customer-service/src/main/java/org/example/customer/dto/CustomerSuggestion.java`

**Implementation:**
```java
@GetMapping("/customers/autocomplete")
public Flux<CustomerSuggestion> autocomplete(
    @RequestParam String q,      // Prefix to match
    @RequestParam(defaultValue = "10") int limit
)

record CustomerSuggestion(
    String customerId,
    String name,
    String email,
    String phone,
    CustomerType type,
    LoyaltyTier loyaltyTier
)
```

---

## Phase 4: Markdown Permission Tiers

**Prereqs:** Existing discount-service
**Blockers:** None

### 4.1 Permission Tier Model

**Files:**
- CREATE: `libs/backend/shared-model/shared-model-discount/src/main/java/org/example/model/discount/MarkdownPermissionTier.java`
- CREATE: `libs/backend/shared-model/shared-model-discount/src/main/java/org/example/model/discount/MarkdownLimit.java`

**Implementation:**
```java
public enum MarkdownPermissionTier {
  ASSOCIATE,    // Basic employee
  SUPERVISOR,   // Team lead
  MANAGER,      // Store manager
  ADMIN         // Admin/override
}

record MarkdownLimit(
    MarkdownPermissionTier tier,
    Set<MarkdownType> allowedTypes,
    Set<MarkdownReason> allowedReasons,
    BigDecimal maxPercentage,
    BigDecimal maxFixedAmount,
    boolean canOverridePrice
) {
  public static final Map<MarkdownPermissionTier, MarkdownLimit> LIMITS = Map.of(
    ASSOCIATE, new MarkdownLimit(ASSOCIATE,
        Set.of(PERCENTAGE, FIXED_AMOUNT),
        Set.of(DAMAGED_ITEM, PRICE_MATCH),
        new BigDecimal("15.00"),
        new BigDecimal("50.00"),
        false),
    SUPERVISOR, new MarkdownLimit(SUPERVISOR,
        Set.of(PERCENTAGE, FIXED_AMOUNT),
        Set.of(DAMAGED_ITEM, PRICE_MATCH, CUSTOMER_SERVICE, BUNDLE_DEAL),
        new BigDecimal("25.00"),
        new BigDecimal("100.00"),
        false),
    MANAGER, new MarkdownLimit(MANAGER,
        Set.of(PERCENTAGE, FIXED_AMOUNT),
        Set.of(DAMAGED_ITEM, PRICE_MATCH, CUSTOMER_SERVICE, BUNDLE_DEAL,
               MANAGER_DISCRETION, LOYALTY_EXCEPTION),
        new BigDecimal("50.00"),
        new BigDecimal("500.00"),
        false),
    ADMIN, new MarkdownLimit(ADMIN,
        Set.of(PERCENTAGE, FIXED_AMOUNT, OVERRIDE_PRICE),
        Set.of(values()),  // All reasons
        new BigDecimal("100.00"),
        null,  // Unlimited
        true)
  );
}
```

### 4.2 Validate Markdown Permission

**Files:**
- MODIFY: `apps/discount-service/src/main/java/org/example/discount/service/MarkdownService.java`
- CREATE: `apps/discount-service/src/main/java/org/example/discount/validation/MarkdownPermissionValidator.java`

**Implementation:**
```java
@Component
public class MarkdownPermissionValidator {

  public Mono<Void> validateMarkdown(
      String employeeId,
      MarkdownPermissionTier tier,
      Markdown markdown
  ) {
    MarkdownLimit limit = MarkdownLimit.LIMITS.get(tier);

    // Validate markdown type allowed
    if (!limit.allowedTypes().contains(markdown.type())) {
      return Mono.error(new UnauthorizedMarkdownException(
          "Type " + markdown.type() + " not allowed for tier " + tier));
    }

    // Validate reason allowed
    if (!limit.allowedReasons().contains(markdown.reason())) {
      return Mono.error(new UnauthorizedMarkdownException(
          "Reason " + markdown.reason() + " not allowed for tier " + tier));
    }

    // Validate amount within limits
    if (markdown.type() == PERCENTAGE &&
        markdown.value().compareTo(limit.maxPercentage()) > 0) {
      return Mono.error(new MarkdownLimitExceededException(
          "Percentage " + markdown.value() + " exceeds limit " + limit.maxPercentage()));
    }

    // ... additional validation

    return Mono.empty();
  }
}
```

### 4.3 Manager Override Flow

**Files:**
- CREATE: `apps/discount-service/src/main/java/org/example/discount/dto/MarkdownOverrideRequest.java`
- CREATE: `apps/discount-service/src/main/java/org/example/discount/model/MarkdownOverride.java`
- MODIFY: `apps/discount-service/src/main/java/org/example/discount/controller/MarkdownController.java`

**Implementation:**
```java
@PostMapping("/markdowns/override")
@PreAuthorize("hasAuthority('SCOPE_markdown:override')")
public Mono<Markdown> applyOverrideMarkdown(
    @RequestBody MarkdownOverrideRequest request
) {
  // Manager can approve markdown that exceeds employee's tier
  // Creates audit trail with approver info
}

record MarkdownOverrideRequest(
    Markdown markdown,
    String approverId,        // Manager who approved
    String approverPin,       // Manager PIN verification
    String overrideReason     // Why override was needed
)
```

---

## Phase 5: WireMock Mappings

**Prereqs:** All backend changes complete
**Blockers:** None

### 5.1 Fulfillment Slots Mock

**Files:**
- CREATE: `e2e/wiremock/mappings/fulfillment-slots.json`

### 5.2 Customer Autocomplete Mock

**Files:**
- CREATE: `e2e/wiremock/mappings/customer-autocomplete.json`

### 5.3 Multi-Fulfillment Mock

**Files:**
- MODIFY: `e2e/wiremock/mappings/checkout.json`

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `shared-model-fulfillment/FulfillmentType.java` | Add WILL_CALL |
| CREATE | `fulfillment-service/controller/FulfillmentSlotsController.java` | Slot availability API |
| CREATE | `shared-model-payment/` | Payment type models |
| MODIFY | `checkout-service/dto/CompleteCheckoutRequest.java` | Polymorphic payments |
| MODIFY | `customer-service/controller/CustomerController.java` | Enhanced search |
| CREATE | `customer-service/controller/CustomerAutocompleteController.java` | Autocomplete API |
| CREATE | `shared-model-discount/MarkdownPermissionTier.java` | Permission tiers |
| CREATE | `discount-service/validation/MarkdownPermissionValidator.java` | Tier validation |
| CREATE | `e2e/wiremock/mappings/*.json` | Mock mappings |

---

## Testing Strategy

**Unit Tests:**
- MarkdownPermissionValidator with all tier/type/reason combinations
- Payment method serialization/deserialization
- Fulfillment slot availability calculation

**Integration Tests:**
- Multi-fulfillment checkout flow
- Customer search with pagination
- Markdown override with manager approval

---

## Checklist

- [ ] Phase 1: Fulfillment enhancements complete
- [ ] Phase 2: Payment types implemented
- [ ] Phase 3: Customer search enhanced
- [ ] Phase 4: Markdown permissions implemented
- [ ] Phase 5: WireMock mappings created
- [ ] All tests passing
