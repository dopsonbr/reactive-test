# 017_DISCOUNT_SERVICE

**Status: DRAFT**

---

## Overview

Enhance the discount-service from a stub to a full-featured pricing engine supporting promotional discounts, employee markdowns, and intelligent best-price calculation. The service computes optimal pricing for customers based on their cart contents, loyalty tier, active benefits, and available promotions. Markdowns are employee-only functionality restricted to in-store and contact center users.

**Implementation Note:** Discount rules and markdowns use in-memory mock repositories for this phase. Database persistence can be added later.

**Related Plans:**
- `015_CUSTOMER_SERVICE` - Customer loyalty tiers and benefits model
- `016_USER_SERVICE` - Employee user type with admin permissions

## Goals

1. Provide mock discount rules and markdown support
2. Support employee-only markdown functionality with authorization enforcement
3. Calculate best price for a customer considering cart, loyalty, and available discounts
4. Apply loyalty tier benefits (percentage discount, free shipping, points multiplier)

## References

**Standards:**
- `docs/standards/architecture.md` - Layered architecture pattern
- `docs/standards/security.md` - Authorization for employee-only endpoints

**Templates:**
- `docs/templates/_template_controller.md` - Controller pattern

## Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                            discount-service                                     │
├────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌────────────────────┐    ┌────────────────────────┐  │
│  │DiscountController│    │  MarkdownController │    │  PricingController     │  │
│  │  (Public Promos) │    │  (Employee Only)    │    │  (Best Price Calc)     │  │
│  └────────┬─────────┘    └─────────┬──────────┘    └───────────┬────────────┘  │
│           │                        │                           │               │
│           └────────────────────────┼───────────────────────────┘               │
│                                    ▼                                           │
│                         ┌────────────────────┐                                 │
│                         │  PricingService    │                                 │
│                         │  - calculateBest() │                                 │
│                         │  - applyLoyalty()  │                                 │
│                         │  - stackDiscounts()│                                 │
│                         └─────────┬──────────┘                                 │
│                                   │                                            │
│       ┌───────────────────────────┼───────────────────────────┐                │
│       ▼                           ▼                           ▼                │
│  ┌──────────────┐        ┌────────────────┐        ┌───────────────────┐       │
│  │DiscountRepo  │        │  MarkdownRepo  │        │  WebClient calls  │       │
│  │ (In-Memory)  │        │  (In-Memory)   │        │  - customer-svc   │       │
│  └──────────────┘        └────────────────┘        │  - user-svc       │       │
│                                                    └───────────────────┘       │
└────────────────────────────────────────────────────────────────────────────────┘

Best Price Calculation Flow:
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. Receive cart + customerId + userId                                       │
│  2. Fetch customer loyalty info (customer-service)                          │
│  3. Fetch user type (user-service) - check if employee                      │
│  4. Gather applicable discounts:                                            │
│     ├── Promo codes (from cart)                                             │
│     ├── Auto-apply promotions (by store/SKU)                                │
│     ├── Loyalty benefits (tier-based discounts)                             │
│     └── Employee markdowns (if user is EMPLOYEE with admin permission)      │
│  5. Calculate best combination (non-stackable vs stackable discounts)       │
│  6. Return PricingResult with itemized savings                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Package Naming

| Module | Package |
|--------|---------|
| shared-model-discount | `org.example.model.discount` |
| discount-service | `org.example.discount` |

---

## Phase 1: Domain Model Extensions

### 1.1 Extended Discount Models

**Files:**
- MODIFY: `libs/shared-model/shared-model-discount/src/main/java/org/example/model/discount/Discount.java`
- CREATE: `libs/shared-model/shared-model-discount/src/main/java/org/example/model/discount/DiscountScope.java`

**Discount record (extended):**

```java
public record Discount(
    String discountId,
    String code,
    DiscountType type,
    BigDecimal value,
    String description,
    Instant expiresAt,
    // New fields
    DiscountScope scope,           // CART, ITEM, SHIPPING
    boolean stackable,             // Can combine with other discounts
    BigDecimal minimumPurchase,    // Minimum cart value to apply
    List<Long> eligibleSkus,       // Empty = all SKUs
    List<Integer> eligibleStores,  // Empty = all stores
    boolean autoApply              // Auto-apply without code entry
) {
    public boolean isValid() {
        return expiresAt == null || expiresAt.isAfter(Instant.now());
    }

    public boolean appliesTo(int storeNumber) {
        return eligibleStores.isEmpty() || eligibleStores.contains(storeNumber);
    }
}
```

**DiscountScope enum:**

```java
public enum DiscountScope {
    CART,      // Applies to entire cart subtotal
    ITEM,      // Applies to specific items
    SHIPPING   // Applies to shipping cost
}
```

### 1.2 Markdown Model (Employee-Only)

**Files:**
- CREATE: `libs/shared-model/shared-model-discount/src/main/java/org/example/model/discount/Markdown.java`
- CREATE: `libs/shared-model/shared-model-discount/src/main/java/org/example/model/discount/MarkdownType.java`
- CREATE: `libs/shared-model/shared-model-discount/src/main/java/org/example/model/discount/MarkdownReason.java`

**Markdown record:**

```java
public record Markdown(
    String markdownId,
    int storeNumber,
    Long sku,                      // Specific SKU or null for cart-level
    MarkdownType type,             // PERCENTAGE, FIXED_AMOUNT, OVERRIDE_PRICE
    BigDecimal value,
    MarkdownReason reason,
    String employeeId,             // Employee who applied markdown
    String customerId,             // Customer receiving markdown
    String cartId,                 // Associated cart
    Instant appliedAt,
    Instant expiresAt              // Markdown expiration (session-based)
) {}

public enum MarkdownType {
    PERCENTAGE,      // Reduce by percentage
    FIXED_AMOUNT,    // Reduce by fixed dollar amount
    OVERRIDE_PRICE   // Set specific price (admin only)
}

public enum MarkdownReason {
    PRICE_MATCH,         // Competitor price match
    DAMAGED_ITEM,        // Damaged/open box
    CUSTOMER_SERVICE,    // Customer satisfaction
    MANAGER_DISCRETION,  // Manager approved
    LOYALTY_EXCEPTION,   // Loyalty tier exception
    BUNDLE_DEAL          // Custom bundle pricing
}
```

### 1.3 Pricing Result Model

**Files:**
- CREATE: `libs/shared-model/shared-model-discount/src/main/java/org/example/model/discount/PricingResult.java`
- CREATE: `libs/shared-model/shared-model-discount/src/main/java/org/example/model/discount/ItemPricing.java`
- CREATE: `libs/shared-model/shared-model-discount/src/main/java/org/example/model/discount/AppliedPromotion.java`
- CREATE: `libs/shared-model/shared-model-discount/src/main/java/org/example/model/discount/LoyaltySummary.java`

**PricingResult record:**

```java
public record PricingResult(
    String cartId,
    BigDecimal originalSubtotal,
    BigDecimal finalSubtotal,
    BigDecimal totalSavings,
    BigDecimal shippingCost,
    BigDecimal shippingDiscount,
    List<ItemPricing> items,
    List<AppliedPromotion> appliedPromotions,
    LoyaltySummary loyaltySummary,
    Instant calculatedAt
) {
    public BigDecimal getTotal() {
        return finalSubtotal.add(shippingCost).subtract(shippingDiscount);
    }
}

public record ItemPricing(
    Long sku,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal originalTotal,
    BigDecimal discountedTotal,
    BigDecimal itemSavings,
    List<String> appliedDiscountIds
) {}

public record AppliedPromotion(
    String promotionId,
    String source,           // "PROMO_CODE", "AUTO_APPLY", "LOYALTY", "MARKDOWN"
    String description,
    BigDecimal savingsAmount,
    DiscountScope scope
) {}

public record LoyaltySummary(
    String loyaltyTier,
    long pointsEarned,
    long pointsBalance,
    long pointsToNextTier,
    List<String> appliedBenefits
) {}
```

---

## Phase 2: Mock Repository Layer

### 2.1 Discount Repository (In-Memory Mock)

**Files:**
- CREATE: `apps/discount-service/src/main/java/org/example/discount/repository/DiscountRepository.java`
- CREATE: `apps/discount-service/src/main/java/org/example/discount/repository/InMemoryDiscountRepository.java`

**DiscountRepository interface:**

```java
public interface DiscountRepository {
    Mono<Discount> findById(String discountId);
    Mono<Discount> findByCode(String code);
    Flux<Discount> findActiveByStore(int storeNumber);
    Flux<Discount> findAutoApplyByStore(int storeNumber);
}
```

**InMemoryDiscountRepository:**

```java
@Repository
public class InMemoryDiscountRepository implements DiscountRepository {

    private static final Map<String, Discount> DISCOUNTS = Map.of(
        "SAVE10", new Discount(
            "disc-001", "SAVE10", DiscountType.PERCENTAGE, BigDecimal.valueOf(10),
            "10% off your order", Instant.now().plus(365, ChronoUnit.DAYS),
            DiscountScope.CART, true, BigDecimal.ZERO, List.of(), List.of(), false),
        "SAVE20", new Discount(
            "disc-002", "SAVE20", DiscountType.PERCENTAGE, BigDecimal.valueOf(20),
            "20% off your order", Instant.now().plus(365, ChronoUnit.DAYS),
            DiscountScope.CART, false, BigDecimal.valueOf(50), List.of(), List.of(), false),
        "FLAT5", new Discount(
            "disc-003", "FLAT5", DiscountType.FIXED_AMOUNT, BigDecimal.valueOf(5),
            "$5 off your order", Instant.now().plus(365, ChronoUnit.DAYS),
            DiscountScope.CART, true, BigDecimal.ZERO, List.of(), List.of(), false),
        "FREESHIP", new Discount(
            "disc-004", "FREESHIP", DiscountType.FREE_SHIPPING, BigDecimal.ZERO,
            "Free shipping", Instant.now().plus(365, ChronoUnit.DAYS),
            DiscountScope.SHIPPING, true, BigDecimal.valueOf(25), List.of(), List.of(), false),
        "SUMMER15", new Discount(
            "disc-005", "SUMMER15", DiscountType.PERCENTAGE, BigDecimal.valueOf(15),
            "Summer sale 15% off", Instant.now().plus(90, ChronoUnit.DAYS),
            DiscountScope.CART, false, BigDecimal.ZERO, List.of(), List.of(), true),
        "LOYALTY5", new Discount(
            "disc-006", "LOYALTY5", DiscountType.PERCENTAGE, BigDecimal.valueOf(5),
            "Loyalty member 5% off", Instant.now().plus(365, ChronoUnit.DAYS),
            DiscountScope.CART, true, BigDecimal.ZERO, List.of(), List.of(), true)
    );

    @Override
    public Mono<Discount> findById(String discountId) {
        return Mono.justOrEmpty(DISCOUNTS.values().stream()
            .filter(d -> d.discountId().equals(discountId))
            .findFirst());
    }

    @Override
    public Mono<Discount> findByCode(String code) {
        return Mono.justOrEmpty(DISCOUNTS.get(code.toUpperCase()));
    }

    @Override
    public Flux<Discount> findActiveByStore(int storeNumber) {
        return Flux.fromIterable(DISCOUNTS.values())
            .filter(Discount::isValid)
            .filter(d -> d.appliesTo(storeNumber));
    }

    @Override
    public Flux<Discount> findAutoApplyByStore(int storeNumber) {
        return findActiveByStore(storeNumber)
            .filter(Discount::autoApply);
    }
}
```

### 2.2 Markdown Repository (In-Memory Mock)

**Files:**
- CREATE: `apps/discount-service/src/main/java/org/example/discount/repository/MarkdownRepository.java`
- CREATE: `apps/discount-service/src/main/java/org/example/discount/repository/InMemoryMarkdownRepository.java`

**MarkdownRepository interface:**

```java
public interface MarkdownRepository {
    Mono<Markdown> findById(String markdownId);
    Flux<Markdown> findActiveByCart(String cartId);
    Mono<Markdown> save(Markdown markdown);
    Mono<Void> delete(String markdownId);
}
```

**InMemoryMarkdownRepository:**

```java
@Repository
public class InMemoryMarkdownRepository implements MarkdownRepository {

    private final Map<String, Markdown> markdowns = new ConcurrentHashMap<>();

    @Override
    public Mono<Markdown> findById(String markdownId) {
        return Mono.justOrEmpty(markdowns.get(markdownId));
    }

    @Override
    public Flux<Markdown> findActiveByCart(String cartId) {
        return Flux.fromIterable(markdowns.values())
            .filter(m -> cartId.equals(m.cartId()))
            .filter(m -> m.expiresAt().isAfter(Instant.now()));
    }

    @Override
    public Mono<Markdown> save(Markdown markdown) {
        markdowns.put(markdown.markdownId(), markdown);
        return Mono.just(markdown);
    }

    @Override
    public Mono<Void> delete(String markdownId) {
        markdowns.remove(markdownId);
        return Mono.empty();
    }
}
```

---

## Phase 3: Service Layer

### 3.1 Discount Service

**Files:**
- CREATE: `apps/discount-service/src/main/java/org/example/discount/service/DiscountService.java`

```java
@Service
public class DiscountService {

    private final DiscountRepository repository;

    public Mono<Discount> validateCode(String code, int storeNumber) {
        return repository.findByCode(code)
            .filter(Discount::isValid)
            .filter(d -> d.appliesTo(storeNumber))
            .switchIfEmpty(Mono.error(new InvalidDiscountException(code)));
    }

    public Flux<Discount> getAutoApplyDiscounts(int storeNumber) {
        return repository.findAutoApplyByStore(storeNumber);
    }

    public Flux<Discount> getActiveDiscounts(int storeNumber) {
        return repository.findActiveByStore(storeNumber);
    }
}
```

### 3.2 Markdown Service (Employee-Only)

**Files:**
- CREATE: `apps/discount-service/src/main/java/org/example/discount/service/MarkdownService.java`

```java
@Service
public class MarkdownService {

    private final MarkdownRepository repository;
    private final UserServiceClient userClient;

    public Mono<Markdown> applyMarkdown(ApplyMarkdownRequest request, String userId) {
        return validateEmployeePermission(userId)
            .then(createMarkdown(request, userId));
    }

    private Mono<Void> validateEmployeePermission(String userId) {
        return userClient.getUser(userId)
            .filter(user -> user.userType() == UserType.EMPLOYEE)
            .filter(user -> user.permissions().contains(Permission.ADMIN))
            .switchIfEmpty(Mono.error(new UnauthorizedMarkdownException(
                "Markdown requires EMPLOYEE user with ADMIN permission")))
            .then();
    }

    private Mono<Markdown> createMarkdown(ApplyMarkdownRequest request, String userId) {
        Markdown markdown = new Markdown(
            UUID.randomUUID().toString(),
            request.storeNumber(),
            request.sku(),
            request.type(),
            request.value(),
            request.reason(),
            userId,
            request.customerId(),
            request.cartId(),
            Instant.now(),
            Instant.now().plus(4, ChronoUnit.HOURS)  // 4-hour session expiry
        );
        return repository.save(markdown);
    }

    public Mono<Void> voidMarkdown(String markdownId, String userId) {
        return validateEmployeePermission(userId)
            .then(repository.delete(markdownId));
    }

    public Flux<Markdown> getMarkdownsForCart(String cartId) {
        return repository.findActiveByCart(cartId);
    }
}
```

### 3.3 Pricing Service (Best Price Calculation)

**Files:**
- CREATE: `apps/discount-service/src/main/java/org/example/discount/service/PricingService.java`

```java
@Service
public class PricingService {

    private final DiscountRepository discountRepository;
    private final MarkdownRepository markdownRepository;
    private final CustomerServiceClient customerClient;
    private final UserServiceClient userClient;

    public Mono<PricingResult> calculateBestPrice(PricingRequest request) {
        return Mono.zip(
            getCustomerLoyalty(request.customerId()),
            getUserContext(request.userId()),
            getApplicableDiscounts(request),
            getActiveMarkdowns(request.cartId())
        ).flatMap(tuple -> {
            LoyaltyInfo loyalty = tuple.getT1();
            UserContext user = tuple.getT2();
            List<Discount> discounts = tuple.getT3();
            List<Markdown> markdowns = tuple.getT4();

            return computeOptimalPricing(request, loyalty, user, discounts, markdowns);
        });
    }

    private Mono<LoyaltyInfo> getCustomerLoyalty(String customerId) {
        if (customerId == null) return Mono.empty();
        return customerClient.getCustomerLoyalty(customerId)
            .onErrorResume(e -> Mono.empty());
    }

    private Mono<UserContext> getUserContext(String userId) {
        if (userId == null) return Mono.just(UserContext.anonymous());
        return userClient.getUser(userId)
            .onErrorResume(e -> Mono.just(UserContext.anonymous()));
    }

    private Mono<List<Discount>> getApplicableDiscounts(PricingRequest request) {
        // Get auto-apply discounts + validate promo codes
        Flux<Discount> autoApply = discountRepository.findAutoApplyByStore(request.storeNumber());
        Flux<Discount> promoCodes = Flux.fromIterable(request.promoCodes())
            .flatMap(code -> discountRepository.findByCode(code)
                .filter(Discount::isValid)
                .filter(d -> d.appliesTo(request.storeNumber())));

        return Flux.merge(autoApply, promoCodes)
            .distinct(Discount::discountId)
            .collectList();
    }

    private Mono<List<Markdown>> getActiveMarkdowns(String cartId) {
        if (cartId == null) return Mono.just(List.of());
        return markdownRepository.findActiveByCart(cartId).collectList();
    }

    private Mono<PricingResult> computeOptimalPricing(
            PricingRequest request,
            LoyaltyInfo loyalty,
            UserContext user,
            List<Discount> discounts,
            List<Markdown> markdowns) {

        BigDecimal subtotal = calculateSubtotal(request.items());
        List<ItemPricing> itemPricings = new ArrayList<>();
        List<AppliedPromotion> appliedPromotions = new ArrayList<>();
        BigDecimal totalSavings = BigDecimal.ZERO;

        // 1. Apply loyalty tier discount (if applicable)
        BigDecimal loyaltyDiscount = applyLoyaltyDiscount(loyalty, subtotal);
        if (loyaltyDiscount.compareTo(BigDecimal.ZERO) > 0) {
            totalSavings = totalSavings.add(loyaltyDiscount);
            appliedPromotions.add(new AppliedPromotion(
                "loyalty-tier", "LOYALTY",
                "Loyalty tier discount", loyaltyDiscount, DiscountScope.CART));
        }

        // 2. Apply best discount combination
        BigDecimal promoSavings = applyBestDiscounts(discounts, subtotal, appliedPromotions);
        totalSavings = totalSavings.add(promoSavings);

        // 3. Apply employee markdowns (if user is employee)
        if (user.isEmployee() && !markdowns.isEmpty()) {
            BigDecimal markdownSavings = applyMarkdowns(markdowns, subtotal, appliedPromotions);
            totalSavings = totalSavings.add(markdownSavings);
        }

        // 4. Calculate shipping
        BigDecimal shippingCost = calculateShipping(request.shipping(), subtotal);
        BigDecimal shippingDiscount = calculateShippingDiscount(discounts, loyalty, shippingCost);

        // 5. Build result
        BigDecimal finalSubtotal = subtotal.subtract(totalSavings).max(BigDecimal.ZERO);
        LoyaltySummary loyaltySummary = buildLoyaltySummary(loyalty, finalSubtotal);

        return Mono.just(new PricingResult(
            request.cartId(),
            subtotal,
            finalSubtotal,
            totalSavings,
            shippingCost,
            shippingDiscount,
            itemPricings,
            appliedPromotions,
            loyaltySummary,
            Instant.now()
        ));
    }

    private BigDecimal applyLoyaltyDiscount(LoyaltyInfo loyalty, BigDecimal subtotal) {
        if (loyalty == null) return BigDecimal.ZERO;

        return loyalty.getBenefit(BenefitType.PERCENTAGE_DISCOUNT)
            .map(benefit -> subtotal
                .multiply(benefit.value())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP))
            .orElse(BigDecimal.ZERO);
    }

    private BigDecimal applyBestDiscounts(
            List<Discount> discounts,
            BigDecimal subtotal,
            List<AppliedPromotion> applied) {

        // Separate stackable and non-stackable
        List<Discount> stackable = discounts.stream()
            .filter(Discount::stackable)
            .filter(d -> d.scope() == DiscountScope.CART)
            .toList();
        List<Discount> nonStackable = discounts.stream()
            .filter(d -> !d.stackable())
            .filter(d -> d.scope() == DiscountScope.CART)
            .toList();

        // Calculate stackable total
        BigDecimal stackableSavings = stackable.stream()
            .map(d -> calculateDiscountValue(d, subtotal))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Find best non-stackable
        BigDecimal bestNonStackable = nonStackable.stream()
            .map(d -> calculateDiscountValue(d, subtotal))
            .max(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO);

        // Use whichever is better
        if (stackableSavings.compareTo(bestNonStackable) >= 0) {
            stackable.forEach(d -> applied.add(new AppliedPromotion(
                d.discountId(), "PROMO_CODE", d.description(),
                calculateDiscountValue(d, subtotal), d.scope())));
            return stackableSavings;
        } else {
            nonStackable.stream()
                .filter(d -> calculateDiscountValue(d, subtotal).equals(bestNonStackable))
                .findFirst()
                .ifPresent(d -> applied.add(new AppliedPromotion(
                    d.discountId(), "PROMO_CODE", d.description(),
                    bestNonStackable, d.scope())));
            return bestNonStackable;
        }
    }

    private BigDecimal calculateDiscountValue(Discount discount, BigDecimal subtotal) {
        if (subtotal.compareTo(discount.minimumPurchase()) < 0) {
            return BigDecimal.ZERO;
        }
        return switch (discount.type()) {
            case PERCENTAGE -> subtotal
                .multiply(discount.value())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            case FIXED_AMOUNT -> discount.value().min(subtotal);
            case FREE_SHIPPING, BUY_X_GET_Y -> BigDecimal.ZERO;
        };
    }
}
```

---

## Phase 4: Controller Layer

### 4.1 Discount Controller (Enhanced)

**Files:**
- MODIFY: `apps/discount-service/src/main/java/org/example/discount/controller/DiscountController.java`

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/discounts/validate?code=` | Validate promo code |
| GET | `/discounts/active` | Get active discounts for store |

### 4.2 Markdown Controller (Employee-Only)

**Files:**
- CREATE: `apps/discount-service/src/main/java/org/example/discount/controller/MarkdownController.java`
- CREATE: `apps/discount-service/src/main/java/org/example/discount/controller/dto/ApplyMarkdownRequest.java`

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/markdowns` | Apply markdown (EMPLOYEE only) |
| GET | `/markdowns/cart/{cartId}` | Get markdowns for cart |
| DELETE | `/markdowns/{id}` | Void markdown (EMPLOYEE only) |

**ApplyMarkdownRequest:**

```java
public record ApplyMarkdownRequest(
    int storeNumber,
    Long sku,
    MarkdownType type,
    BigDecimal value,
    MarkdownReason reason,
    String customerId,
    String cartId
) {}
```

**MarkdownController:**

```java
@RestController
@RequestMapping("/markdowns")
public class MarkdownController {

    private final MarkdownService markdownService;

    @PostMapping
    public Mono<ResponseEntity<Markdown>> applyMarkdown(
            @RequestBody ApplyMarkdownRequest request,
            @RequestHeader("x-userid") String userId) {

        return markdownService.applyMarkdown(request, userId)
            .map(ResponseEntity::ok)
            .onErrorResume(UnauthorizedMarkdownException.class,
                e -> Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build()));
    }

    @GetMapping("/cart/{cartId}")
    public Flux<Markdown> getMarkdownsForCart(@PathVariable String cartId) {
        return markdownService.getMarkdownsForCart(cartId);
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> voidMarkdown(
            @PathVariable String id,
            @RequestHeader("x-userid") String userId) {

        return markdownService.voidMarkdown(id, userId)
            .then(Mono.just(ResponseEntity.noContent().<Void>build()))
            .onErrorResume(UnauthorizedMarkdownException.class,
                e -> Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build()));
    }
}
```

### 4.3 Pricing Controller

**Files:**
- CREATE: `apps/discount-service/src/main/java/org/example/discount/controller/PricingController.java`
- CREATE: `apps/discount-service/src/main/java/org/example/discount/controller/dto/PricingRequest.java`

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/pricing/calculate` | Calculate best price for cart |

**PricingRequest:**

```java
public record PricingRequest(
    String cartId,
    String customerId,
    String userId,
    int storeNumber,
    List<CartItem> items,
    List<String> promoCodes,
    ShippingOption shipping
) {}

public record CartItem(long sku, int quantity, BigDecimal unitPrice) {}

public enum ShippingOption { STANDARD, EXPRESS, PICKUP }
```

---

## Phase 5: Service Clients

### 5.1 Customer Service Client

**Files:**
- CREATE: `apps/discount-service/src/main/java/org/example/discount/client/CustomerServiceClient.java`

```java
@Component
public class CustomerServiceClient {

    private final WebClient webClient;

    public Mono<LoyaltyInfo> getCustomerLoyalty(String customerId) {
        return webClient.get()
            .uri("/customers/{id}", customerId)
            .retrieve()
            .bodyToMono(Customer.class)
            .map(Customer::loyalty)
            .onErrorResume(e -> Mono.empty());
    }
}
```

### 5.2 User Service Client

**Files:**
- CREATE: `apps/discount-service/src/main/java/org/example/discount/client/UserServiceClient.java`
- CREATE: `apps/discount-service/src/main/java/org/example/discount/client/UserContext.java`

```java
@Component
public class UserServiceClient {

    private final WebClient webClient;

    public Mono<UserContext> getUser(String userId) {
        return webClient.get()
            .uri("/users/{id}", userId)
            .retrieve()
            .bodyToMono(User.class)
            .map(user -> new UserContext(
                user.userType(), user.permissions(), user.storeNumber()))
            .onErrorResume(e -> Mono.just(UserContext.anonymous()));
    }
}

public record UserContext(UserType userType, Set<Permission> permissions, Integer storeNumber) {
    public static UserContext anonymous() {
        return new UserContext(UserType.CUSTOMER, Set.of(Permission.READ), null);
    }

    public boolean isEmployee() {
        return userType == UserType.EMPLOYEE;
    }

    public boolean canApplyMarkdown() {
        return isEmployee() && permissions.contains(Permission.ADMIN);
    }
}
```

---

## Phase 6: Configuration

### 6.1 Build Dependencies

**Files:**
- MODIFY: `apps/discount-service/build.gradle.kts`

```kotlin
dependencies {
    implementation(platform(project(":libs:platform:platform-bom")))

    implementation(project(":libs:shared-model:shared-model-discount"))
    implementation(project(":libs:shared-model:shared-model-customer"))

    implementation(project(":libs:platform:platform-logging"))
    implementation(project(":libs:platform:platform-error"))
    implementation(project(":libs:platform:platform-webflux"))

    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    runtimeOnly("io.micrometer:micrometer-registry-prometheus")

    testImplementation(project(":libs:platform:platform-test"))
}
```

### 6.2 Application Configuration

**Files:**
- CREATE: `apps/discount-service/src/main/resources/application.yml`

```yaml
server:
  port: 8085

spring:
  application:
    name: discount-service

services:
  customer-service:
    url: ${CUSTOMER_SERVICE_URL:http://localhost:8083}
  user-service:
    url: ${USER_SERVICE_URL:http://localhost:8084}

management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
```

### 6.3 Docker Configuration

**Files:**
- CREATE: `docker/Dockerfile.discount-service`
- MODIFY: `docker/docker-compose.yml`

Add discount-service with port 8085.

---

## Phase 7: Exception Handling

**Files:**
- CREATE: `apps/discount-service/src/main/java/org/example/discount/exception/InvalidDiscountException.java`
- CREATE: `apps/discount-service/src/main/java/org/example/discount/exception/UnauthorizedMarkdownException.java`

| Exception | Use Case | HTTP Status |
|-----------|----------|-------------|
| `InvalidDiscountException` | Code not found or invalid | 404 |
| `UnauthorizedMarkdownException` | Non-employee markdown attempt | 403 |

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `libs/shared-model/shared-model-discount/.../Discount.java` | Extended model |
| CREATE | `libs/shared-model/shared-model-discount/.../DiscountScope.java` | Scope enum |
| CREATE | `libs/shared-model/shared-model-discount/.../Markdown.java` | Markdown model |
| CREATE | `libs/shared-model/shared-model-discount/.../MarkdownType.java` | Type enum |
| CREATE | `libs/shared-model/shared-model-discount/.../MarkdownReason.java` | Reason enum |
| CREATE | `libs/shared-model/shared-model-discount/.../PricingResult.java` | Result model |
| CREATE | `libs/shared-model/shared-model-discount/.../ItemPricing.java` | Item model |
| CREATE | `libs/shared-model/shared-model-discount/.../AppliedPromotion.java` | Promotion model |
| CREATE | `libs/shared-model/shared-model-discount/.../LoyaltySummary.java` | Loyalty model |
| CREATE | `apps/discount-service/.../repository/DiscountRepository.java` | Interface |
| CREATE | `apps/discount-service/.../repository/InMemoryDiscountRepository.java` | Mock impl |
| CREATE | `apps/discount-service/.../repository/MarkdownRepository.java` | Interface |
| CREATE | `apps/discount-service/.../repository/InMemoryMarkdownRepository.java` | Mock impl |
| CREATE | `apps/discount-service/.../service/DiscountService.java` | Discount ops |
| CREATE | `apps/discount-service/.../service/MarkdownService.java` | Markdown ops |
| CREATE | `apps/discount-service/.../service/PricingService.java` | Best price calc |
| MODIFY | `apps/discount-service/.../controller/DiscountController.java` | Enhanced |
| CREATE | `apps/discount-service/.../controller/MarkdownController.java` | Endpoints |
| CREATE | `apps/discount-service/.../controller/PricingController.java` | Endpoints |
| CREATE | `apps/discount-service/.../controller/dto/*.java` | DTOs |
| CREATE | `apps/discount-service/.../client/CustomerServiceClient.java` | Client |
| CREATE | `apps/discount-service/.../client/UserServiceClient.java` | Client |
| CREATE | `apps/discount-service/.../client/UserContext.java` | Context record |
| CREATE | `apps/discount-service/.../exception/*.java` | Exceptions |
| MODIFY | `apps/discount-service/build.gradle.kts` | Dependencies |
| CREATE | `apps/discount-service/src/main/resources/application.yml` | Config |
| CREATE | `docker/Dockerfile.discount-service` | Docker build |
| MODIFY | `docker/docker-compose.yml` | Add service |

---

## Testing Strategy

### Test Scenarios
- Validate promo code returns discount details
- Invalid promo code returns 404
- Employee applies markdown successfully
- Non-employee markdown attempt returns 403
- Best price calculation applies loyalty discount
- Stackable discounts combine correctly
- Best non-stackable beats stackable when higher
- FREE_SHIPPING benefit removes shipping cost
- Markdown session expires after 4 hours

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add discount-service port 8085 |
| `apps/discount-service/README.md` | Service documentation |

---

## Checklist

- [ ] Phase 1: Domain models extended/created
- [ ] Phase 2: Mock repositories implemented
- [ ] Phase 3: Service layer implemented
- [ ] Phase 4: Controller layer implemented
- [ ] Phase 5: Service clients created
- [ ] Phase 6: Configuration complete
- [ ] Phase 7: Exception handling added
- [ ] Employee-only markdown authorization verified
- [ ] Best price calculation tested with loyalty tiers
- [ ] Documentation updated
