# 015_CUSTOMER_SERVICE

**Status: DRAFT**

---

## Overview

Implement a full-featured customer-service supporting CRUD operations and flexible search capabilities. The customer model supports both D2C (Direct-to-Consumer) and B2B (Business-to-Business) use cases, including hierarchical account structures for business customers with sub-accounts, address management, wallet references, and communication preferences.

**Related Plans:**
- `008_CART_SERVICE.md` - Similar PostgreSQL + R2DBC patterns

## Goals

1. Implement complete CRUD operations for customers
2. Support search by customer ID, phone number, or email
3. Design flexible customer model supporting D2C and B2B use cases
4. Enable B2B hierarchical structures with parent/child account relationships
5. Manage customer addresses, wallet references, and communication preferences

## References

**Standards:**
- `docs/standards/architecture.md` - Layered architecture pattern
- `docs/standards/models.md` - Domain model as pure records
- `docs/standards/validation.md` - Request validation patterns

**Templates:**
- `docs/templates/_template_postgres_repository.md` - PostgreSQL repository pattern
- `docs/templates/_template_controller.md` - Controller pattern

**ADRs:**
- `docs/ADRs/002_write_data_store.md` - Postgres for durable writes

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         customer-service                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌───────────────────┐    ┌─────────────────┐  │
│  │ CustomerController│───►│ CustomerService   │───►│CustomerRepository│ │
│  │   (REST API)      │    │ (Business Logic)  │    │  (PostgreSQL)   │  │
│  └──────────────────┘    └───────────────────┘    └─────────────────┘  │
│           │                       │                        │            │
│           ▼                       │                        ▼            │
│  ┌──────────────────┐             │               ┌─────────────────┐  │
│  │CustomerValidator │             │               │   PostgreSQL    │  │
│  └──────────────────┘             │               │   (R2DBC)       │  │
│                                   ▼               └─────────────────┘  │
│                          ┌───────────────────┐                         │
│                          │  Redis (Cache)    │                         │
│                          └───────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Customer Model Structure

```
Customer (D2C or B2B)
├── Basic Info (id, name, email, phone)
├── CustomerType (CONSUMER | BUSINESS)
├── Addresses[]
│   ├── AddressType (BILLING | SHIPPING | HEADQUARTERS)
│   └── Address details
├── WalletReference (external wallet ID)
├── CommunicationPreferences
│   ├── emailOptIn, smsOptIn, pushOptIn
│   └── preferredChannel, language
├── LoyaltyInfo
│   ├── LoyaltyTier (BRONZE | SILVER | GOLD | PLATINUM | DIAMOND)
│   ├── pointsBalance, lifetimePoints
│   ├── activeBenefits[] (discounts, free shipping, multipliers)
│   └── enrollmentDate, tierExpirationDate
└── B2B Hierarchy (if BUSINESS)
    ├── parentCustomerId (nullable)
    ├── companyInfo (taxId, industry)
    └── childAccountIds[]
```

### Package Naming

| Module | Package |
|--------|---------|
| shared-model-customer | `org.example.model.customer` |
| customer-service | `org.example.customer` |

---

## Phase 1: Domain Model (shared-model-customer)

### 1.1 Core Customer Record

**Files:**
- CREATE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/Customer.java`
- DELETE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/CartCustomer.java`

**Implementation:**

```java
public record Customer(
    String customerId,
    int storeNumber,
    String name,
    String email,
    String phone,
    CustomerType type,
    CustomerStatus status,
    List<Address> addresses,
    WalletReference wallet,
    CommunicationPreferences communicationPreferences,
    LoyaltyInfo loyalty,  // loyalty tier and benefits
    B2BInfo b2bInfo,  // null for D2C customers
    Instant createdAt,
    Instant updatedAt
) {
    public boolean isB2B() {
        return type == CustomerType.BUSINESS;
    }

    public boolean isD2C() {
        return type == CustomerType.CONSUMER;
    }

    public Optional<Address> getBillingAddress() {
        return addresses.stream()
            .filter(a -> a.type() == AddressType.BILLING)
            .findFirst();
    }

    public boolean hasLoyaltyBenefit(BenefitType benefit) {
        return loyalty != null && loyalty.hasBenefit(benefit);
    }
}
```

### 1.2 Supporting Types

**Files:**
- CREATE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/CustomerType.java`
- CREATE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/CustomerStatus.java`
- CREATE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/Address.java`
- CREATE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/AddressType.java`
- CREATE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/WalletReference.java`
- CREATE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/CommunicationPreferences.java`
- CREATE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/LoyaltyInfo.java`
- CREATE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/LoyaltyTier.java`
- CREATE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/LoyaltyBenefit.java`
- CREATE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/BenefitType.java`
- CREATE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/B2BInfo.java`
- CREATE: `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/CompanyInfo.java`

**CustomerType enum:**

```java
public enum CustomerType {
    CONSUMER,  // D2C - individual retail customer
    BUSINESS   // B2B - business account with potential hierarchy
}
```

**CustomerStatus enum:**

```java
public enum CustomerStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED,
    PENDING_VERIFICATION
}
```

**Address record:**

```java
public record Address(
    String addressId,
    AddressType type,
    String line1,
    String line2,
    String city,
    String state,
    String postalCode,
    String country,
    boolean isPrimary
) {}
```

**AddressType enum:**

```java
public enum AddressType {
    BILLING,
    SHIPPING,
    HEADQUARTERS,  // B2B primary location
    BRANCH         // B2B subsidiary location
}
```

**WalletReference record:**

```java
public record WalletReference(
    String walletId,
    String walletProvider,  // "STRIPE", "PAYPAL", "INTERNAL"
    WalletStatus status     // ACTIVE, SUSPENDED, PENDING_SETUP
) {}
```

**CommunicationPreferences record:**

```java
public record CommunicationPreferences(
    boolean emailOptIn, boolean smsOptIn, boolean pushOptIn, boolean mailOptIn,
    PreferredChannel preferredChannel,  // EMAIL, SMS, PUSH, MAIL
    String preferredLanguage, String timezone
) {}
```

**LoyaltyInfo record:**

```java
public record LoyaltyInfo(
    String loyaltyId,
    LoyaltyTier tier,
    long pointsBalance,
    long lifetimePoints,
    List<LoyaltyBenefit> activeBenefits,
    LocalDate enrollmentDate,
    LocalDate tierExpirationDate,
    LocalDate tierAchievedDate
) {
    public boolean hasBenefit(BenefitType type) {
        return activeBenefits != null && activeBenefits.stream()
            .anyMatch(b -> b.type() == type && b.isActive());
    }

    public Optional<LoyaltyBenefit> getBenefit(BenefitType type) {
        return activeBenefits == null ? Optional.empty() :
            activeBenefits.stream()
                .filter(b -> b.type() == type && b.isActive())
                .findFirst();
    }

    public boolean isTierExpiringSoon(int daysThreshold) {
        return tierExpirationDate != null &&
            tierExpirationDate.isBefore(LocalDate.now().plusDays(daysThreshold));
    }
}
```

**LoyaltyTier enum:**

```java
public enum LoyaltyTier {
    BRONZE(1, 0),
    SILVER(2, 1000),
    GOLD(3, 5000),
    PLATINUM(4, 15000),
    DIAMOND(5, 50000);

    // Fields: level, pointsRequired
    // Methods: getLevel(), getPointsRequired(), forPoints(long)
}
```

**LoyaltyBenefit record:**

```java
public record LoyaltyBenefit(
    String benefitId,
    BenefitType type,
    String description,
    BigDecimal value,  // discount %, points multiplier, or threshold
    LocalDate validFrom,
    LocalDate validUntil,
    Integer usageLimit,  // null = unlimited
    Integer usageCount
) {
    public boolean isActive() { /* checks date range and usage limit */ }
}
```

**BenefitType enum:**

| Category | Types |
|----------|-------|
| Discounts | `PERCENTAGE_DISCOUNT`, `FIXED_DISCOUNT` |
| Shipping | `FREE_SHIPPING`, `EXPEDITED_SHIPPING` |
| Points | `POINTS_MULTIPLIER`, `BONUS_POINTS` |
| Access | `EARLY_ACCESS`, `EXCLUSIVE_PRODUCTS`, `PRIORITY_SUPPORT` |
| Special | `FREE_GIFT`, `FREE_RETURNS`, `BIRTHDAY_REWARD`, `ANNIVERSARY_REWARD` |

**B2BInfo record (null for D2C):**

```java
public record B2BInfo(
    String parentCustomerId,  // null if root account
    CompanyInfo companyInfo,
    List<String> childAccountIds,
    AccountTier accountTier,  // STANDARD, PREFERRED, ENTERPRISE
    String salesRepId
) {
    public boolean isRootAccount() { return parentCustomerId == null; }
    public boolean hasSubAccounts() { return childAccountIds != null && !childAccountIds.isEmpty(); }
}

public record CompanyInfo(String companyName, String taxId, String industry, String dunsNumber, int employeeCount) {}
```

---

## Phase 2: Database Schema

### 2.1 Flyway Migration

**Files:**
- CREATE: `apps/customer-service/src/main/resources/db/migration/V1__create_customers_table.sql`

**Implementation:**

```sql
-- Main customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY,
    store_number INTEGER NOT NULL,
    customer_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    customer_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',

    -- B2B hierarchy support
    parent_customer_id VARCHAR(255),

    -- JSONB columns for nested data
    addresses_json JSONB NOT NULL DEFAULT '[]',
    wallet_json JSONB,
    communication_prefs_json JSONB NOT NULL DEFAULT '{}',
    loyalty_json JSONB,  -- loyalty tier, points, and benefits
    b2b_info_json JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for CRUD and search operations
CREATE INDEX idx_customers_store_number ON customers(store_number);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_parent_id ON customers(parent_customer_id);
CREATE INDEX idx_customers_updated_at ON customers(updated_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_customers_store_type ON customers(store_number, customer_type);
CREATE INDEX idx_customers_store_status ON customers(store_number, status);

-- Unique constraint for email per store (allows same email in different stores)
CREATE UNIQUE INDEX idx_customers_store_email ON customers(store_number, email);
```

### 2.2 Search Index Migration

**Files:**
- CREATE: `apps/customer-service/src/main/resources/db/migration/V2__add_search_indexes.sql`

**Implementation:**

```sql
-- Full-text search support for name
CREATE INDEX idx_customers_name_search ON customers
    USING gin(to_tsvector('english', name));

-- Case-insensitive email search
CREATE INDEX idx_customers_email_lower ON customers(LOWER(email));

-- Partial index for active customers (most common queries)
CREATE INDEX idx_customers_active ON customers(store_number, customer_type)
    WHERE status = 'ACTIVE';

-- Index for loyalty tier queries (GIN index on JSONB field)
CREATE INDEX idx_customers_loyalty_tier ON customers
    USING gin((loyalty_json -> 'tier'));
```

---

## Phase 3: Repository Layer

### 3.1 Entity Class

**Files:**
- CREATE: `apps/customer-service/src/main/java/org/example/customer/repository/CustomerEntity.java`

**Implementation:**

```java
@Table("customers")
public record CustomerEntity(
    @Id UUID id,
    @Column("store_number") int storeNumber,
    @Column("customer_id") String customerId,
    @Column("name") String name,
    @Column("email") String email,
    @Column("phone") String phone,
    @Column("customer_type") String customerType,
    @Column("status") String status,
    @Column("parent_customer_id") String parentCustomerId,
    @Column("addresses_json") String addressesJson,
    @Column("wallet_json") String walletJson,
    @Column("communication_prefs_json") String communicationPrefsJson,
    @Column("loyalty_json") String loyaltyJson,
    @Column("b2b_info_json") String b2bInfoJson,
    @Column("created_at") Instant createdAt,
    @Column("updated_at") Instant updatedAt
) {}
```

### 3.2 Spring Data R2DBC Repository

**Files:**
- CREATE: `apps/customer-service/src/main/java/org/example/customer/repository/CustomerEntityRepository.java`

**Implementation:**

```java
@Repository
public interface CustomerEntityRepository extends ReactiveCrudRepository<CustomerEntity, UUID> {

    Mono<CustomerEntity> findByCustomerId(String customerId);

    Flux<CustomerEntity> findByStoreNumber(int storeNumber);

    Flux<CustomerEntity> findByStoreNumberAndCustomerType(int storeNumber, String customerType);

    Mono<CustomerEntity> findByStoreNumberAndEmail(int storeNumber, String email);

    @Query("SELECT * FROM customers WHERE store_number = :storeNumber AND phone = :phone")
    Mono<CustomerEntity> findByStoreNumberAndPhone(int storeNumber, String phone);

    @Query("SELECT * FROM customers WHERE parent_customer_id = :parentId")
    Flux<CustomerEntity> findByParentCustomerId(String parentId);

    @Query("""
        SELECT * FROM customers
        WHERE store_number = :storeNumber
        AND (
            customer_id = :searchTerm
            OR LOWER(email) = LOWER(:searchTerm)
            OR phone = :searchTerm
        )
        """)
    Flux<CustomerEntity> searchByIdEmailOrPhone(int storeNumber, String searchTerm);

    @Query("""
        SELECT * FROM customers
        WHERE store_number = :storeNumber
        AND status = 'ACTIVE'
        ORDER BY updated_at DESC
        LIMIT :limit OFFSET :offset
        """)
    Flux<CustomerEntity> findActiveByStorePaginated(int storeNumber, int limit, int offset);

    Mono<Long> countByStoreNumber(int storeNumber);

    Mono<Long> countByStoreNumberAndCustomerType(int storeNumber, String customerType);

    @Query("""
        SELECT * FROM customers
        WHERE store_number = :storeNumber
        AND loyalty_json ->> 'tier' = :tier
        """)
    Flux<CustomerEntity> findByStoreNumberAndLoyaltyTier(int storeNumber, String tier);
}
```

### 3.3 Domain Repository Interface

**Files:**
- CREATE: `apps/customer-service/src/main/java/org/example/customer/repository/CustomerRepository.java`

**Implementation:**

```java
public interface CustomerRepository {

    Mono<Customer> findById(String customerId);

    Mono<Customer> findByEmail(int storeNumber, String email);

    Mono<Customer> findByPhone(int storeNumber, String phone);

    Flux<Customer> findByStore(int storeNumber);

    Flux<Customer> findByStoreAndType(int storeNumber, CustomerType type);

    Flux<Customer> findChildAccounts(String parentCustomerId);

    Flux<Customer> search(int storeNumber, String searchTerm);

    Flux<Customer> findActiveByStore(int storeNumber, int page, int size);

    Mono<Customer> save(Customer customer);

    Mono<Void> deleteById(String customerId);

    Mono<Boolean> exists(String customerId);

    Mono<Long> countByStore(int storeNumber);

    Mono<Long> countByStoreAndType(int storeNumber, CustomerType type);

    Flux<Customer> findByLoyaltyTier(int storeNumber, LoyaltyTier tier);
}
```

### 3.4 PostgreSQL Repository Implementation

**Files:**
- CREATE: `apps/customer-service/src/main/java/org/example/customer/repository/PostgresCustomerRepository.java`

**Implementation:**

```java
@Repository
public class PostgresCustomerRepository implements CustomerRepository {

    private final CustomerEntityRepository entityRepository;
    private final ObjectMapper objectMapper;

    public PostgresCustomerRepository(CustomerEntityRepository entityRepository,
                                       ObjectMapper objectMapper) {
        this.entityRepository = entityRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Customer> findById(String customerId) {
        return entityRepository.findByCustomerId(customerId)
                .flatMap(this::toDomain);
    }

    @Override
    public Mono<Customer> findByEmail(int storeNumber, String email) {
        return entityRepository.findByStoreNumberAndEmail(storeNumber, email)
                .flatMap(this::toDomain);
    }

    @Override
    public Mono<Customer> findByPhone(int storeNumber, String phone) {
        return entityRepository.findByStoreNumberAndPhone(storeNumber, phone)
                .flatMap(this::toDomain);
    }

    @Override
    public Flux<Customer> search(int storeNumber, String searchTerm) {
        return entityRepository.searchByIdEmailOrPhone(storeNumber, searchTerm)
                .flatMap(this::toDomain);
    }

    @Override
    public Flux<Customer> findChildAccounts(String parentCustomerId) {
        return entityRepository.findByParentCustomerId(parentCustomerId)
                .flatMap(this::toDomain);
    }

    @Override
    public Mono<Customer> save(Customer customer) {
        return toEntity(customer)
                .flatMap(entityRepository::save)
                .flatMap(this::toDomain);
    }

    // ... toDomain and toEntity mapping methods per template pattern
}
```

---

## Phase 4: Service Layer

### 4.1 Customer Service

**Files:**
- CREATE: `apps/customer-service/src/main/java/org/example/customer/service/CustomerService.java`

**Implementation:**

```java
@Service
public class CustomerService {

    private final CustomerRepository repository;
    private final StructuredLogger logger;

    public CustomerService(CustomerRepository repository, StructuredLogger logger) {
        this.repository = repository;
        this.logger = logger;
    }

    // === CRUD Operations ===

    public Mono<Customer> getCustomer(String customerId) {
        return repository.findById(customerId)
                .switchIfEmpty(Mono.error(new CustomerNotFoundException(customerId)));
    }

    public Mono<Customer> createCustomer(CreateCustomerRequest request) {
        return Mono.fromCallable(() -> buildCustomer(request))
                .flatMap(repository::save)
                .doOnSuccess(c -> logger.info("Customer created",
                    Map.of("customerId", c.customerId(), "type", c.type())));
    }

    public Mono<Customer> updateCustomer(String customerId, UpdateCustomerRequest request) {
        return repository.findById(customerId)
                .switchIfEmpty(Mono.error(new CustomerNotFoundException(customerId)))
                .map(existing -> applyUpdates(existing, request))
                .flatMap(repository::save);
    }

    public Mono<Void> deleteCustomer(String customerId) {
        return repository.findById(customerId)
                .switchIfEmpty(Mono.error(new CustomerNotFoundException(customerId)))
                .flatMap(customer -> {
                    if (customer.isB2B() && customer.b2bInfo().hasSubAccounts()) {
                        return Mono.error(new BusinessRuleException(
                            "Cannot delete B2B account with active sub-accounts"));
                    }
                    return repository.deleteById(customerId);
                });
    }

    // === Search Operations ===

    public Mono<Customer> searchByEmail(int storeNumber, String email) {
        return repository.findByEmail(storeNumber, email);
    }

    public Mono<Customer> searchByPhone(int storeNumber, String phone) {
        return repository.findByPhone(storeNumber, phone);
    }

    public Flux<Customer> search(int storeNumber, String searchTerm) {
        return repository.search(storeNumber, searchTerm);
    }

    // === B2B Hierarchy Operations ===

    public Flux<Customer> getSubAccounts(String parentCustomerId) {
        return repository.findById(parentCustomerId)
                .filter(Customer::isB2B)
                .switchIfEmpty(Mono.error(new BusinessRuleException(
                    "Only B2B accounts can have sub-accounts")))
                .flatMapMany(parent -> repository.findChildAccounts(parentCustomerId));
    }

    public Mono<Customer> createSubAccount(String parentCustomerId,
                                            CreateCustomerRequest request) {
        return repository.findById(parentCustomerId)
                .filter(Customer::isB2B)
                .switchIfEmpty(Mono.error(new BusinessRuleException(
                    "Parent must be a B2B account")))
                .flatMap(parent -> {
                    Customer subAccount = buildSubAccount(parent, request);
                    return repository.save(subAccount);
                });
    }

    // === Helper Methods ===

    private Customer buildCustomer(CreateCustomerRequest request) {
        String customerId = UUID.randomUUID().toString();
        Instant now = Instant.now();

        B2BInfo b2bInfo = request.type() == CustomerType.BUSINESS
                ? new B2BInfo(null, request.companyInfo(), List.of(),
                              AccountTier.STANDARD, null)
                : null;

        return new Customer(
            customerId,
            request.storeNumber(),
            request.name(),
            request.email(),
            request.phone(),
            request.type(),
            CustomerStatus.ACTIVE,
            request.addresses(),
            request.wallet(),
            request.communicationPreferences(),
            b2bInfo,
            now,
            now
        );
    }
}
```

---

## Phase 5: Controller Layer

### 5.1 Request/Response DTOs

**Files:**
- CREATE: `apps/customer-service/src/main/java/org/example/customer/controller/dto/CreateCustomerRequest.java`
- CREATE: `apps/customer-service/src/main/java/org/example/customer/controller/dto/UpdateCustomerRequest.java`
- CREATE: `apps/customer-service/src/main/java/org/example/customer/controller/dto/CustomerSearchRequest.java`
- CREATE: `apps/customer-service/src/main/java/org/example/customer/controller/dto/CustomerResponse.java`

**CreateCustomerRequest:**

```java
public record CreateCustomerRequest(
    int storeNumber,
    String name,
    String email,
    String phone,
    CustomerType type,
    List<Address> addresses,
    WalletReference wallet,
    CommunicationPreferences communicationPreferences,
    CompanyInfo companyInfo  // Required if type is BUSINESS
) {}
```

**CustomerSearchRequest:**

```java
public record CustomerSearchRequest(
    String customerId,
    String email,
    String phone
) {
    public boolean hasSearchCriteria() {
        return customerId != null || email != null || phone != null;
    }
}
```

### 5.2 Request Validator

**Files:**
- CREATE: `apps/customer-service/src/main/java/org/example/customer/validation/CustomerRequestValidator.java`

**Implementation:**

```java
@Component
public class CustomerRequestValidator {

    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Pattern PHONE_PATTERN =
        Pattern.compile("^\\+?[1-9]\\d{1,14}$");

    public Mono<Void> validateCreateRequest(CreateCustomerRequest request) {
        List<ValidationError> errors = new ArrayList<>();

        if (request.name() == null || request.name().isBlank()) {
            errors.add(new ValidationError("name", "Name is required"));
        }
        if (request.email() == null || !EMAIL_PATTERN.matcher(request.email()).matches()) {
            errors.add(new ValidationError("email", "Valid email is required"));
        }
        if (request.phone() != null && !PHONE_PATTERN.matcher(request.phone()).matches()) {
            errors.add(new ValidationError("phone", "Invalid phone format"));
        }
        if (request.type() == null) {
            errors.add(new ValidationError("type", "Customer type is required"));
        }
        if (request.type() == CustomerType.BUSINESS && request.companyInfo() == null) {
            errors.add(new ValidationError("companyInfo",
                "Company info required for B2B customers"));
        }
        if (request.storeNumber() < 1 || request.storeNumber() > 2000) {
            errors.add(new ValidationError("storeNumber", "Must be between 1 and 2000"));
        }

        return errors.isEmpty()
            ? Mono.empty()
            : Mono.error(new ValidationException(errors));
    }

    public Mono<Void> validateSearchRequest(CustomerSearchRequest request) {
        if (!request.hasSearchCriteria()) {
            return Mono.error(new ValidationException(List.of(
                new ValidationError("search",
                    "At least one search criterion required (customerId, email, or phone)")
            )));
        }
        return Mono.empty();
    }
}
```

### 5.3 Customer Controller

**Files:**
- MODIFY: `apps/customer-service/src/main/java/org/example/customer/controller/CustomerController.java`

**REST Endpoints (per `docs/templates/_template_controller.md`):**

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/customers/{customerId}` | `customer:read` | Get customer by ID |
| POST | `/customers` | `customer:write` | Create customer |
| PUT | `/customers/{customerId}` | `customer:write` | Update customer |
| DELETE | `/customers/{customerId}` | `customer:delete` | Delete customer |
| GET | `/customers/search?customerId=&email=&phone=` | `customer:read` | Search by ID, email, or phone |
| GET | `/customers/{customerId}/sub-accounts` | `customer:read` | Get B2B sub-accounts |
| POST | `/customers/{customerId}/sub-accounts` | `customer:write` | Create B2B sub-account |

All endpoints follow standard patterns:
- Extract `RequestMetadata` from headers (`x-store-number`, `x-order-number`, `x-userid`, `x-sessionid`)
- Use `Mono.deferContextual()` with `contextWrite()` for context propagation
- Apply `@PreAuthorize` for scope-based authorization

---

## Phase 6: Configuration & Infrastructure

### 6.1 Build Dependencies

**Files:**
- MODIFY: `apps/customer-service/build.gradle.kts`

**Add dependencies:**

```kotlin
dependencies {
    // Existing dependencies...

    // PostgreSQL (R2DBC)
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("org.postgresql:r2dbc-postgresql")

    // Database migrations
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")

    // Platform libraries (add if not present)
    implementation(project(":libs:platform:platform-resilience"))
    implementation(project(":libs:platform:platform-cache"))
    implementation(project(":libs:platform:platform-security"))

    // Test dependencies
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:r2dbc")
}
```

### 6.2 Application Configuration

**Files:**
- CREATE: `apps/customer-service/src/main/resources/application.yml`

**Key configuration (follow cart-service pattern):**
- R2DBC: `r2dbc:postgresql://...customerdb` with pool size 5-20
- Flyway: `jdbc:postgresql://...customerdb` for migrations
- Redis: for caching
- OAuth2: JWT resource server with issuer validation
- Server port: 8083
- Actuator: health, info, metrics, prometheus endpoints

### 6.3 Docker Configuration

**Files:**
- CREATE: `docker/Dockerfile.customer-service` (copy from `Dockerfile.cart-service`, update JAR path)
- MODIFY: `docker/docker-compose.yml`

**docker-compose.yml addition:** Add `customer-service` entry with:
- Port mapping: `8083:8080`
- Database: `customerdb` (R2DBC + Flyway URLs)
- Dependencies: `postgres`, `redis`
- OTEL service name: `customer-service`

---

## Phase 7: Exception Handling

**Files:**
- CREATE: `apps/customer-service/src/main/java/org/example/customer/exception/CustomerNotFoundException.java`
- CREATE: `apps/customer-service/src/main/java/org/example/customer/exception/BusinessRuleException.java`
- CREATE: `apps/customer-service/src/main/java/org/example/customer/exception/DuplicateCustomerException.java`

| Exception | Use Case | HTTP Status |
|-----------|----------|-------------|
| `CustomerNotFoundException` | Customer ID not found | 404 |
| `BusinessRuleException` | Business rule violations (e.g., delete B2B with sub-accounts) | 422 |
| `DuplicateCustomerException` | Email already exists in store | 409 |

Global error handling via `platform-error` converts these to standard `ErrorResponse`.

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/Customer.java` | Core customer domain record |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/CustomerType.java` | CONSUMER/BUSINESS enum |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/CustomerStatus.java` | Account status enum |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/Address.java` | Address record |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/AddressType.java` | Address type enum |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/WalletReference.java` | Wallet reference record |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/CommunicationPreferences.java` | Communication prefs record |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/LoyaltyInfo.java` | Loyalty tier and benefits info |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/LoyaltyTier.java` | BRONZE/SILVER/GOLD/PLATINUM/DIAMOND |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/LoyaltyBenefit.java` | Individual benefit record |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/BenefitType.java` | Benefit type enum |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/B2BInfo.java` | B2B hierarchy info |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/CompanyInfo.java` | Company details for B2B |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/AccountTier.java` | B2B account tier enum |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/PreferredChannel.java` | Communication channel enum |
| CREATE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/WalletStatus.java` | Wallet status enum |
| DELETE | `libs/shared-model/shared-model-customer/src/main/java/org/example/model/customer/CartCustomer.java` | Remove stub |
| CREATE | `apps/customer-service/src/main/resources/db/migration/V1__create_customers_table.sql` | Main table schema |
| CREATE | `apps/customer-service/src/main/resources/db/migration/V2__add_search_indexes.sql` | Search indexes |
| CREATE | `apps/customer-service/src/main/java/org/example/customer/repository/CustomerEntity.java` | DB entity class |
| CREATE | `apps/customer-service/src/main/java/org/example/customer/repository/CustomerEntityRepository.java` | R2DBC repository |
| CREATE | `apps/customer-service/src/main/java/org/example/customer/repository/CustomerRepository.java` | Domain repository interface |
| CREATE | `apps/customer-service/src/main/java/org/example/customer/repository/PostgresCustomerRepository.java` | Postgres implementation |
| CREATE | `apps/customer-service/src/main/java/org/example/customer/service/CustomerService.java` | Business logic service |
| CREATE | `apps/customer-service/src/main/java/org/example/customer/controller/dto/CreateCustomerRequest.java` | Create request DTO |
| CREATE | `apps/customer-service/src/main/java/org/example/customer/controller/dto/UpdateCustomerRequest.java` | Update request DTO |
| CREATE | `apps/customer-service/src/main/java/org/example/customer/controller/dto/CustomerSearchRequest.java` | Search request DTO |
| CREATE | `apps/customer-service/src/main/java/org/example/customer/validation/CustomerRequestValidator.java` | Request validation |
| MODIFY | `apps/customer-service/src/main/java/org/example/customer/controller/CustomerController.java` | REST endpoints |
| CREATE | `apps/customer-service/src/main/java/org/example/customer/exception/CustomerNotFoundException.java` | Not found exception |
| CREATE | `apps/customer-service/src/main/java/org/example/customer/exception/BusinessRuleException.java` | Business rule exception |
| CREATE | `apps/customer-service/src/main/java/org/example/customer/exception/DuplicateCustomerException.java` | Duplicate exception |
| CREATE | `apps/customer-service/src/main/java/org/example/customer/config/DatabaseConfig.java` | R2DBC configuration |
| MODIFY | `apps/customer-service/build.gradle.kts` | Add dependencies |
| CREATE | `apps/customer-service/src/main/resources/application.yml` | Application config |
| CREATE | `docker/Dockerfile.customer-service` | Docker build |
| MODIFY | `docker/docker-compose.yml` | Add customer-service |

---

## Testing Strategy

### Unit Tests
- `CustomerServiceTest` - Business logic with mocked repository
- `CustomerRequestValidatorTest` - Validation rules
- `PostgresCustomerRepositoryTest` - Entity mapping

### Integration Tests
- `CustomerControllerIntegrationTest` - Full request/response cycle with Testcontainers
- `CustomerSearchIntegrationTest` - Search by ID, email, phone
- `B2BHierarchyIntegrationTest` - Parent/child account operations

### Test Scenarios
- Create D2C customer with minimal fields
- Create B2B customer with company info
- Create sub-account under B2B parent
- Prevent sub-account creation under D2C customer
- Prevent deletion of B2B account with active sub-accounts
- Search by each criterion (ID, email, phone)
- Validate duplicate email rejection per store
- Create customer with loyalty enrollment
- Update loyalty tier based on points
- Validate active benefits by date and usage
- Query customers by loyalty tier

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add customer-service to Module Overview table, add port 8083 |
| `libs/shared-model/shared-model-customer/README.md` | Document all domain records |
| `libs/shared-model/shared-model-customer/AGENTS.md` | AI guidance for customer model |
| `apps/customer-service/README.md` | Service documentation |
| `apps/customer-service/AGENTS.md` | AI guidance for customer-service |

---

## Checklist

- [ ] Phase 1: Domain model records created in shared-model-customer
- [ ] Phase 2: Database migrations created
- [ ] Phase 3: Repository layer implemented
- [ ] Phase 4: Service layer implemented
- [ ] Phase 5: Controller layer implemented
- [ ] Phase 6: Configuration and Docker setup complete
- [ ] Phase 7: Exception handling added
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Documentation updated
- [ ] Build succeeds: `./gradlew :apps:customer-service:build`
- [ ] Docker runs: `docker compose up customer-service`
