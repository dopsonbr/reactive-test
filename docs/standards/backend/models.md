# Models Standard

## Intent

Keep domain models as pure data containers with no business logic, ensuring testability, immutability, and separation of concerns.

## Outcomes

- Models are simple, predictable data holders
- No hidden side effects in model creation
- Easy serialization/deserialization
- Testable without mocking
- Clear separation between data and behavior

## Patterns

### Use Java Records

Records are the preferred way to define models:

```java
record Product(
    long sku,
    String description,
    String price,
    int availableQuantity
) {}
```

### No Business Logic in Models

Models contain ONLY:
- Fields (data)
- Accessors (automatic with records)
- equals/hashCode/toString (automatic with records)

Models NEVER contain:
- Validation logic
- Transformation logic
- Factory methods with business rules
- Service calls
- State mutations

### Creation Logic Lives Outside

**Wrong - logic in model:**

```java
record Order(String id, List<Item> items, BigDecimal total) {
    // DON'T DO THIS
    public Order addItem(Item item) {
        var newItems = new ArrayList<>(items);
        newItems.add(item);
        return new Order(id, newItems, calculateTotal(newItems));
    }
}
```

**Right - logic in service:**

```java
record Order(String id, List<Item> items, BigDecimal total) {}

class OrderService {
    public Order addItem(Order order, Item item) {
        var newItems = new ArrayList<>(order.items());
        newItems.add(item);
        return new Order(order.id(), newItems, calculateTotal(newItems));
    }
}
```

### Validation Lives in Validators

```java
record CreateProductRequest(long sku, String description) {}

class ProductRequestValidator {
    public Mono<Void> validate(CreateProductRequest request) {
        List<ValidationError> errors = new ArrayList<>();
        if (request.sku() <= 0) {
            errors.add(new ValidationError("sku", "Must be positive"));
        }
        if (request.description() == null || request.description().isBlank()) {
            errors.add(new ValidationError("description", "Required"));
        }
        return errors.isEmpty()
            ? Mono.empty()
            : Mono.error(new ValidationException(errors));
    }
}
```

### Transformation Lives in Mappers/Services

```java
record ExternalProductResponse(String sku, String desc, String amt) {}
record Product(long sku, String description, String price) {}

class ProductMapper {
    public Product fromExternal(ExternalProductResponse external) {
        return new Product(
            Long.parseLong(external.sku()),
            external.desc(),
            external.amt()
        );
    }
}
```

### Model Categories

| Category | Location | Example |
|----------|----------|---------|
| Domain models | `domain/` | `Product`, `Cart`, `CartItem` |
| API requests | `controller/` or `validation/` | `CreateCartRequest` |
| API responses | `controller/` or `domain/` | `ProductResponse` |
| External responses | `repository/{service}/` | `MerchandiseResponse` |

### Immutability

All models MUST be immutable:
- Use records (immutable by default)
- For collections, use `List.of()`, `Set.of()`, `Map.of()`
- Never expose mutable collections

```java
// Good - immutable with defensive copy
record Cart(String id, List<CartItem> items) {
    public Cart {
        items = List.copyOf(items); // Defensive copy
    }
}

// Bad - mutable collection exposed
record Cart(String id, List<CartItem> items) {} // items can be modified externally
```

### Nested Records

For complex domain models, use nested records:

```java
record Cart(
    String cartId,
    Customer customer,
    List<CartProduct> products,
    List<Discount> discounts,
    CartTotals totals
) {
    public Cart {
        products = List.copyOf(products);
        discounts = List.copyOf(discounts);
    }
}

record Customer(String customerId, String name, String email) {}
record CartProduct(long sku, int quantity, String price) {}
record Discount(String code, String amount) {}
record CartTotals(String subtotal, String tax, String total) {}
```

## Anti-patterns

### Logic in Constructors

```java
// DON'T - validation in constructor
record Product(long sku, String description) {
    public Product {
        if (sku <= 0) throw new IllegalArgumentException("Invalid SKU");
    }
}
```

### Factory Methods with Business Rules

```java
// DON'T - business logic in static factory
record Order(String id, Status status) {
    public static Order create() {
        return new Order(UUID.randomUUID().toString(), Status.PENDING);
    }
}
```

### Derived Fields Calculated in Model

```java
// DON'T - calculation in model
record Cart(List<CartItem> items) {
    public BigDecimal getTotal() {
        return items.stream()
            .map(CartItem::subtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}

// DO - calculation in service, store result
record Cart(List<CartItem> items, BigDecimal total) {}
```

### Mutable Models

```java
// DON'T - mutable class
class Product {
    private String description;
    public void setDescription(String desc) { this.description = desc; }
}
```

### Spring Annotations on Models

```java
// DON'T - framework coupling
@Entity
record Product(@Id long sku, @Column String description) {}

// DO - keep models pure, use separate JPA entities if needed
record Product(long sku, String description) {}
```

### Optional Fields with Complex Defaults

```java
// DON'T - default logic in model
record Order(String id, Instant createdAt) {
    public Order(String id) {
        this(id, Instant.now()); // Hidden side effect
    }
}

// DO - explicit creation in service
record Order(String id, Instant createdAt) {}

class OrderService {
    Order create(String id) {
        return new Order(id, clock.instant());
    }
}
```

## Reference

- `apps/product-service/src/.../domain/Product.java` - Domain model example
- `apps/product-service/src/.../repository/*/` - Response record examples
- `apps/cart-service/src/.../domain/` - Cart domain models
