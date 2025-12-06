# Unit Testing Standard

## Intent

Test individual components in isolation for fast feedback and high confidence in component behavior.

## Outcomes

- Fast test execution (seconds, not minutes)
- High code coverage for business logic
- Isolated component testing
- Clear test intent and documentation

## Patterns

### Test Class Naming

| Source Class | Test Class |
|--------------|------------|
| `ProductService.java` | `ProductServiceTest.java` |
| `ProductRequestValidator.java` | `ProductRequestValidatorTest.java` |
| `MerchandiseRepository.java` | `MerchandiseRepositoryTest.java` |

### Test Method Naming

Two acceptable patterns:

```java
// Pattern 1: methodName_condition_expectedResult
@Test
void getProduct_validSku_returnsProduct() { }

@Test
void getProduct_invalidSku_throwsValidationException() { }

@Test
void validate_missingStoreNumber_returnsError() { }

// Pattern 2: should_expectedBehavior_when_condition
@Test
void shouldReturnProduct_whenSkuIsValid() { }

@Test
void shouldThrowValidationException_whenSkuIsInvalid() { }

@Test
void shouldReturnFallback_whenServiceFails() { }
```

### Test Structure (Arrange-Act-Assert)

```java
@Test
void getProduct_validSku_returnsAggregatedProduct() {
    // Arrange
    long sku = 123456L;
    Merchandise merchandise = new Merchandise("Test Product", "Description", 10);
    Price price = new Price("19.99", "USD");
    Inventory inventory = new Inventory(50, true);

    given(merchandiseRepository.getMerchandise(sku)).willReturn(Mono.just(merchandise));
    given(priceRepository.getPrice(sku)).willReturn(Mono.just(price));
    given(inventoryRepository.getInventory(sku, anyInt())).willReturn(Mono.just(inventory));

    // Act
    Mono<Product> result = productService.getProduct(sku, 1234);

    // Assert
    StepVerifier.create(result)
        .assertNext(product -> {
            assertThat(product.description()).isEqualTo("Test Product");
            assertThat(product.price()).isEqualTo("19.99");
            assertThat(product.availableQuantity()).isEqualTo(50);
        })
        .verifyComplete();
}
```

### Reactor Testing with StepVerifier

```java
// Verify successful completion
@Test
void getMerchandise_validSku_returnsMerchandise() {
    StepVerifier.create(repository.getMerchandise(123456L))
        .expectNextMatches(m -> m.name().equals("Test Product"))
        .verifyComplete();
}

// Verify error
@Test
void validate_invalidSku_throwsException() {
    StepVerifier.create(validator.validate(-1, headers))
        .expectError(ValidationException.class)
        .verify();
}

// Verify empty
@Test
void findProduct_notFound_returnsEmpty() {
    StepVerifier.create(repository.findBySku(999999L))
        .verifyComplete();  // No expectNext, just complete
}

// Verify with timeout
@Test
void getProduct_slowService_completesWithinTimeout() {
    StepVerifier.create(service.getProduct(123L))
        .expectNextCount(1)
        .verifyComplete();
    // Test will fail if takes > 5 seconds (default)
}
```

### Mocking Dependencies

Use Mockito with `@ExtendWith(MockitoExtension.class)`:

```java
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private MerchandiseRepository merchandiseRepository;

    @Mock
    private PriceRepository priceRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void getProduct_allServicesSucceed_returnsAggregatedProduct() {
        // given
        given(merchandiseRepository.getMerchandise(anyLong()))
            .willReturn(Mono.just(MERCHANDISE));
        given(priceRepository.getPrice(anyLong()))
            .willReturn(Mono.just(PRICE));
        given(inventoryRepository.getInventory(anyLong(), anyInt()))
            .willReturn(Mono.just(INVENTORY));

        // when/then
        StepVerifier.create(productService.getProduct(123L, 1234))
            .assertNext(product -> {
                assertThat(product).isNotNull();
                assertThat(product.sku()).isEqualTo(123L);
            })
            .verifyComplete();
    }
}
```

### Testing Error Scenarios

```java
@Test
void getProduct_merchandiseServiceFails_returnsFallback() {
    // given
    given(merchandiseRepository.getMerchandise(anyLong()))
        .willReturn(Mono.error(new RuntimeException("Service unavailable")));
    given(priceRepository.getPrice(anyLong()))
        .willReturn(Mono.just(PRICE));
    given(inventoryRepository.getInventory(anyLong(), anyInt()))
        .willReturn(Mono.just(INVENTORY));

    // when/then
    StepVerifier.create(productService.getProduct(123L, 1234))
        .assertNext(product -> {
            assertThat(product.description()).isEqualTo("Product information temporarily unavailable");
        })
        .verifyComplete();
}
```

### Testing Validators

```java
@ExtendWith(MockitoExtension.class)
class ProductRequestValidatorTest {

    private ProductRequestValidator validator;

    @BeforeEach
    void setUp() {
        validator = new ProductRequestValidator();
    }

    @Test
    void validate_allValid_completesEmpty() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-store-number", "1234");
        headers.set("x-order-number", "123e4567-e89b-12d3-a456-426614174000");
        headers.set("x-userid", "abc123");
        headers.set("x-sessionid", "123e4567-e89b-12d3-a456-426614174000");

        StepVerifier.create(validator.validate(123456L, headers))
            .verifyComplete();
    }

    @Test
    void validate_invalidStoreNumber_returnsError() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-store-number", "9999");  // > 2000

        StepVerifier.create(validator.validate(123456L, headers))
            .expectErrorSatisfies(error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getDetailsMap()).containsKey("x-store-number");
            })
            .verify();
    }

    @Test
    void validate_multipleErrors_returnsAllErrors() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-store-number", "9999");
        headers.set("x-userid", "ab");  // Too short

        StepVerifier.create(validator.validate(-1L, headers))  // Invalid SKU
            .expectErrorSatisfies(error -> {
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors()).hasSize(3);
            })
            .verify();
    }
}
```

### Test Data Builders

```java
class TestData {
    static Merchandise merchandise() {
        return new Merchandise("Test Product", "Description", 10);
    }

    static Merchandise merchandise(String name) {
        return new Merchandise(name, "Description", 10);
    }

    static Price price() {
        return new Price("19.99", "USD");
    }

    static Price price(String amount) {
        return new Price(amount, "USD");
    }

    static Inventory inventory() {
        return new Inventory(50, true);
    }

    static Inventory inventory(int quantity) {
        return new Inventory(quantity, quantity > 0);
    }

    static HttpHeaders validHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-store-number", "1234");
        headers.set("x-order-number", UUID.randomUUID().toString());
        headers.set("x-userid", "abc123");
        headers.set("x-sessionid", UUID.randomUUID().toString());
        return headers;
    }
}
```

## Anti-patterns

### Testing Multiple Things in One Test

```java
// DON'T - tests validation AND business logic
@Test
void getProduct_test() {
    // Test validation
    assertThrows(ValidationException.class, () -> service.getProduct(-1L, 1234));

    // Test success
    Product product = service.getProduct(123L, 1234).block();
    assertNotNull(product);

    // Test fallback
    given(repo.get(anyLong())).willReturn(Mono.error(new RuntimeException()));
    Product fallback = service.getProduct(456L, 1234).block();
    assertEquals("Unavailable", fallback.description());
}

// DO - separate tests
@Test
void getProduct_invalidSku_throwsValidationException() { }

@Test
void getProduct_validSku_returnsProduct() { }

@Test
void getProduct_serviceError_returnsFallback() { }
```

### No Assertions (Test That Can't Fail)

```java
// DON'T - test always passes
@Test
void getProduct_test() {
    service.getProduct(123L, 1234);  // No assertion!
}

// DO - verify behavior
@Test
void getProduct_validSku_returnsProduct() {
    StepVerifier.create(service.getProduct(123L, 1234))
        .assertNext(product -> assertThat(product).isNotNull())
        .verifyComplete();
}
```

### Testing Implementation Details

```java
// DON'T - tests internal method calls
@Test
void getProduct_callsAllRepositories() {
    service.getProduct(123L, 1234).block();

    verify(merchandiseRepository).getMerchandise(123L);
    verify(priceRepository).getPrice(123L);
    verify(inventoryRepository).getInventory(123L, 1234);
    // Tightly coupled to implementation
}

// DO - test observable behavior
@Test
void getProduct_validSku_returnsAggregatedData() {
    StepVerifier.create(service.getProduct(123L, 1234))
        .assertNext(product -> {
            assertThat(product.description()).isEqualTo("Expected");
            assertThat(product.price()).isEqualTo("19.99");
            assertThat(product.availableQuantity()).isEqualTo(50);
        })
        .verifyComplete();
}
```

### Slow Unit Tests

```java
// DON'T - actual HTTP calls in unit tests
@Test
void getProduct_callsExternalService() {
    WebClient realClient = WebClient.create("http://localhost:8082");
    // This is an integration test!
}

// DON'T - unnecessary delays
@Test
void getProduct_withDelay() {
    Thread.sleep(1000);  // Why?
}

// DO - mock dependencies for fast tests
@Test
void getProduct_mockedDependencies_fast() {
    given(repo.get(anyLong())).willReturn(Mono.just(MOCK_DATA));
    // Test completes in milliseconds
}
```

### Using block() in Tests

```java
// DON'T - loses reactive context
@Test
void getProduct_blocking() {
    Product product = service.getProduct(123L).block();
    assertNotNull(product);
}

// DO - use StepVerifier
@Test
void getProduct_reactive() {
    StepVerifier.create(service.getProduct(123L))
        .assertNext(product -> assertThat(product).isNotNull())
        .verifyComplete();
}
```

### Ignoring Test Failures

```java
// DON'T
@Test
@Disabled("Flaky, fix later")  // Technical debt
void getProduct_test() { }

// DON'T
@Test
void getProduct_test() {
    try {
        // test code
    } catch (Exception e) {
        // Swallowed - test always passes
    }
}
```

## Reference

- `apps/product-service/src/test/java/` - Unit test examples
- `libs/platform/platform-test/` - Test utilities
