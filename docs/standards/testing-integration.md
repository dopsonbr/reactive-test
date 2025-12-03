# Integration Testing Standard

## Intent

Test components with real infrastructure (Redis, HTTP services) to verify integration behavior and realistic scenarios.

## Outcomes

- Verified integration with external systems
- Realistic test scenarios using containers
- Reproducible tests across environments
- Confidence in end-to-end component behavior

## Patterns

### Test Class Setup

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class ProductServiceIntegrationTest {

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379)
        .waitingFor(Wait.forListeningPort());

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }

    @LocalServerPort
    private int port;

    @Autowired
    private WebTestClient webTestClient;
}
```

### Testcontainers for Infrastructure

```java
// Redis
@Container
static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
    .withExposedPorts(6379)
    .waitingFor(Wait.forListeningPort());

// PostgreSQL
@Container
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
    .withDatabaseName("testdb")
    .withUsername("test")
    .withPassword("test");

// Kafka
@Container
static KafkaContainer kafka = new KafkaContainer(
    DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));
```

### WireMock for External HTTP Services

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RepositoryIntegrationTest {

    @RegisterExtension
    static WireMockExtension wiremock = WireMockExtension.newInstance()
        .options(wireMockConfig().dynamicPort())
        .build();

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("merchandise.base-url", () -> wiremock.baseUrl());
        registry.add("price.base-url", () -> wiremock.baseUrl());
        registry.add("inventory.base-url", () -> wiremock.baseUrl());
    }

    @Test
    void getProduct_externalServiceReturnsData_aggregatesCorrectly() {
        // Arrange
        wiremock.stubFor(get(urlPathEqualTo("/merchandise/123456"))
            .willReturn(okJson("""
                {
                    "name": "Test Product",
                    "description": "A test product",
                    "weight": 10
                }
                """)));

        wiremock.stubFor(get(urlPathEqualTo("/price/123456"))
            .willReturn(okJson("""
                {
                    "amount": "19.99",
                    "currency": "USD"
                }
                """)));

        wiremock.stubFor(get(urlPathMatching("/inventory/123456/store/.*"))
            .willReturn(okJson("""
                {
                    "quantity": 50,
                    "available": true
                }
                """)));

        // Act & Assert
        webTestClient.get()
            .uri("/products/123456")
            .header("x-store-number", "1234")
            .header("x-order-number", UUID.randomUUID().toString())
            .header("x-userid", "abc123")
            .header("x-sessionid", UUID.randomUUID().toString())
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.description").isEqualTo("Test Product")
            .jsonPath("$.price").isEqualTo("19.99")
            .jsonPath("$.availableQuantity").isEqualTo(50);
    }
}
```

### Required Integration Tests

Every application MUST have these integration tests:

| Test | Purpose |
|------|---------|
| `contextLoads()` | Verify Spring context starts |
| Redis integration | Verify cache behavior |
| Controller tests | Verify HTTP endpoints |
| Repository tests | Verify external service integration |
| Validation tests | Verify header/input validation |

### Context Load Test

```java
@SpringBootTest
@Testcontainers
class ProductServiceApplicationTest {

    @Container
    static GenericContainer<?> redis = RedisTestSupport.createRedisContainer();

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }

    @Test
    void contextLoads() {
        // If this test passes, Spring context started successfully
    }
}
```

### Redis Integration Test

```java
@SpringBootTest
@Testcontainers
class CacheIntegrationTest {

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureRedis(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }

    @Autowired
    private ReactiveCacheService cacheService;

    @Test
    void putAndGet_returnsStoredValue() {
        String key = "test:key:" + UUID.randomUUID();
        String value = "test-value";

        StepVerifier.create(
            cacheService.put(key, value)
                .then(cacheService.get(key, String.class))
        )
            .expectNext(value)
            .verifyComplete();
    }

    @Test
    void get_expiredKey_returnsEmpty() {
        String key = "test:key:" + UUID.randomUUID();

        StepVerifier.create(
            cacheService.put(key, "value", Duration.ofMillis(100))
                .delayElement(Duration.ofMillis(200))
                .then(cacheService.get(key, String.class))
        )
            .verifyComplete();  // Empty Mono
    }
}
```

### Controller Integration Test

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class ProductControllerIntegrationTest {

    @Container
    static GenericContainer<?> redis = RedisTestSupport.createRedisContainer();

    @RegisterExtension
    static WireMockExtension wiremock = WireMockExtension.newInstance()
        .options(wireMockConfig().dynamicPort())
        .build();

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
        registry.add("merchandise.base-url", () -> wiremock.baseUrl());
    }

    @Autowired
    private WebTestClient webTestClient;

    @Test
    void getProduct_validRequest_returns200() {
        stubExternalServices();

        webTestClient.get()
            .uri("/products/123456")
            .headers(this::addRequiredHeaders)
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.sku").isEqualTo(123456);
    }

    @Test
    void getProduct_missingHeaders_returns400() {
        webTestClient.get()
            .uri("/products/123456")
            // No headers
            .exchange()
            .expectStatus().isBadRequest()
            .expectBody()
            .jsonPath("$.details.x-store-number").exists();
    }

    @Test
    void getProduct_externalServiceDown_returnsFallback() {
        wiremock.stubFor(get(anyUrl())
            .willReturn(serviceUnavailable()));

        webTestClient.get()
            .uri("/products/123456")
            .headers(this::addRequiredHeaders)
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.description").isEqualTo("Product information temporarily unavailable");
    }

    private void addRequiredHeaders(HttpHeaders headers) {
        headers.set("x-store-number", "1234");
        headers.set("x-order-number", UUID.randomUUID().toString());
        headers.set("x-userid", "abc123");
        headers.set("x-sessionid", UUID.randomUUID().toString());
    }
}
```

### Test Utilities

Use shared test utilities from platform-test:

```java
// RedisTestSupport
public class RedisTestSupport {
    public static GenericContainer<?> createRedisContainer() {
        return new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379)
            .waitingFor(Wait.forListeningPort());
    }

    public static int getRedisPort(GenericContainer<?> redis) {
        return redis.getMappedPort(6379);
    }
}

// WireMockSupport
public class WireMockSupport {
    public static void stubSuccessfulMerchandise(WireMockExtension wiremock, long sku) {
        wiremock.stubFor(get(urlPathEqualTo("/merchandise/" + sku))
            .willReturn(okJson(merchandiseJson())));
    }

    public static void stubServiceUnavailable(WireMockExtension wiremock) {
        wiremock.stubFor(get(anyUrl())
            .willReturn(serviceUnavailable()));
    }
}
```

## Anti-patterns

### Mocking Redis in Integration Tests

```java
// DON'T - defeats the purpose
@SpringBootTest
class IntegrationTest {
    @MockBean
    private RedisTemplate redisTemplate;  // Mocked - not integration!
}

// DO - use Testcontainers
@SpringBootTest
@Testcontainers
class IntegrationTest {
    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);
}
```

### Hardcoded Ports

```java
// DON'T - port conflicts, flaky tests
@RegisterExtension
static WireMockExtension wiremock = WireMockExtension.newInstance()
    .options(wireMockConfig().port(8082))  // May be in use!
    .build();

// DO - use dynamic ports
@RegisterExtension
static WireMockExtension wiremock = WireMockExtension.newInstance()
    .options(wireMockConfig().dynamicPort())
    .build();
```

### Tests Depending on External Services

```java
// DON'T - requires external service running
@SpringBootTest
class IntegrationTest {
    @Test
    void test() {
        // Calls real merchandise-service at localhost:8082
        // Fails if service not running
    }
}

// DO - use WireMock
@RegisterExtension
static WireMockExtension wiremock = WireMockExtension.newInstance()
    .options(wireMockConfig().dynamicPort())
    .build();

@DynamicPropertySource
static void configureProperties(DynamicPropertyRegistry registry) {
    registry.add("merchandise.base-url", () -> wiremock.baseUrl());
}
```

### Skipping Context Load Test

```java
// DON'T - skip basic sanity check
// No contextLoads() test

// DO - always include
@Test
void contextLoads() {
    // Verifies all beans can be created, configuration is valid
}
```

### Test Order Dependencies

```java
// DON'T - tests depend on order
@TestMethodOrder(OrderAnnotation.class)
class IntegrationTest {
    @Test
    @Order(1)
    void createProduct() { /* creates product */ }

    @Test
    @Order(2)
    void getProduct() { /* assumes product exists from test 1 */ }
}

// DO - each test is independent
@Test
void createAndGetProduct() {
    // Create
    Product created = createProduct();
    // Get
    Product fetched = getProduct(created.id());
    assertThat(fetched).isEqualTo(created);
}
```

### Not Cleaning Up Test Data

```java
// DON'T - test data accumulates
@Test
void test1() {
    redis.put("key1", "value1");
}

@Test
void test2() {
    // key1 still exists, may cause interference
}

// DO - clean up or use unique keys
@BeforeEach
void setUp() {
    // Clean up Redis between tests
    reactiveRedisTemplate.delete(reactiveRedisTemplate.keys("test:*")).block();
}

// Or use unique keys
@Test
void test() {
    String key = "test:" + UUID.randomUUID();
}
```

### Ignoring Async Behavior

```java
// DON'T - race condition
@Test
void asyncOperation() {
    service.asyncWrite("key", "value");
    String result = service.read("key").block();  // May be null!
}

// DO - wait for completion
@Test
void asyncOperation() {
    StepVerifier.create(
        service.asyncWrite("key", "value")
            .then(service.read("key"))
    )
        .expectNext("value")
        .verifyComplete();
}
```

## Reference

- `apps/product-service/src/test/java/.../ProductServiceApplicationTest.java` - Context test
- `libs/platform/platform-test/RedisTestSupport.java` - Test utilities
- `libs/platform/platform-test/WireMockSupport.java` - WireMock helpers
