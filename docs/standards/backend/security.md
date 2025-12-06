# Security Standard

## Intent

Protect APIs from unauthorized access, validate all inputs, and ensure secure communication between services.

## Outcomes

- Authenticated requests only (where required)
- Validated request headers and parameters
- No injection vulnerabilities
- Secure service-to-service communication
- Defense in depth

## Patterns

### Authentication Layers

```
┌─────────────────────────────────────────────────┐
│                   API Gateway                    │
│  - JWT validation                               │
│  - Rate limiting                                │
│  - TLS termination                              │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│                 Service Layer                    │
│  - Header validation                            │
│  - Input sanitization                           │
│  - Authorization checks                         │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│             Downstream Services                  │
│  - Client credentials (OAuth2)                  │
│  - Mutual TLS (mTLS)                           │
└─────────────────────────────────────────────────┘
```

### Required Headers

All endpoints MUST validate these context headers:

| Header | Format | Validation | Purpose |
|--------|--------|------------|---------|
| `x-store-number` | Integer | 1-2000 | Store context |
| `x-order-number` | UUID | UUID pattern | Order correlation |
| `x-userid` | String | 6 alphanumeric | User identification |
| `x-sessionid` | UUID | UUID pattern | Session tracking |

### Header Validation

```java
@Component
class RequestValidator {
    private static final Pattern UUID_PATTERN =
        Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");
    private static final Pattern USERID_PATTERN =
        Pattern.compile("^[a-zA-Z0-9]{6}$");

    public Mono<Void> validate(HttpHeaders headers) {
        List<ValidationError> errors = new ArrayList<>();

        validateStoreNumber(headers, errors);
        validateOrderNumber(headers, errors);
        validateUserId(headers, errors);
        validateSessionId(headers, errors);

        return errors.isEmpty()
            ? Mono.empty()
            : Mono.error(new ValidationException(errors));
    }
}
```

### OAuth2 Resource Server (JWT)

For authenticated endpoints:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com
          jwk-set-uri: https://auth.example.com/.well-known/jwks.json
```

```java
@Configuration
@EnableWebFluxSecurity
class SecurityConfig {

    @Bean
    SecurityWebFilterChain securityFilterChain(ServerHttpSecurity http) {
        return http
            .csrf(csrf -> csrf.disable())  // Stateless API
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers("/actuator/health/**").permitAll()
                .pathMatchers("/actuator/prometheus").permitAll()
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(Customizer.withDefaults())
            )
            .build();
    }
}
```

### Client Credentials for Outbound Calls

Service-to-service authentication:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          merchandise-service:
            client-id: ${CLIENT_ID}
            client-secret: ${CLIENT_SECRET}
            authorization-grant-type: client_credentials
            scope: read:merchandise
        provider:
          merchandise-service:
            token-uri: https://auth.example.com/oauth/token
```

```java
@Bean
WebClient merchandiseWebClient(
        ReactiveClientRegistrationRepository clients,
        ServerOAuth2AuthorizedClientRepository authorizedClients) {

    ServerOAuth2AuthorizedClientExchangeFilterFunction oauth2 =
        new ServerOAuth2AuthorizedClientExchangeFilterFunction(
            new AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager(
                clients, new InMemoryReactiveOAuth2AuthorizedClientService(clients)
            )
        );
    oauth2.setDefaultClientRegistrationId("merchandise-service");

    return WebClient.builder()
        .baseUrl(merchandiseBaseUrl)
        .filter(oauth2)
        .build();
}
```

### Input Sanitization

Never trust client input:

```java
// Path parameters
@GetMapping("/products/{sku}")
Mono<Product> getProduct(@PathVariable long sku) {
    // Long type prevents injection
    if (sku <= 0) {
        return Mono.error(new ValidationException("sku", "Must be positive"));
    }
    return productService.getProduct(sku);
}

// Query parameters
@GetMapping("/search")
Mono<List<Product>> search(@RequestParam String query) {
    // Sanitize before use
    String sanitized = sanitize(query);
    return productService.search(sanitized);
}
```

### Authorization

Check permissions in service layer:

```java
@Service
class CartService {

    Mono<Cart> getCart(String cartId, String userId) {
        return cartRepository.findById(cartId)
            .filter(cart -> cart.ownerId().equals(userId))
            .switchIfEmpty(Mono.error(new ForbiddenException("Not authorized")));
    }
}
```

### Secrets Management

Never hardcode secrets:

```yaml
# Good - environment variables
spring:
  datasource:
    password: ${DB_PASSWORD}

# Good - secrets manager
spring:
  cloud:
    vault:
      uri: https://vault.example.com
```

### HTTPS/TLS

All communication should be encrypted:

```yaml
server:
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${KEYSTORE_PASSWORD}
    key-store-type: PKCS12
```

For internal communication, use mTLS:

```yaml
server:
  ssl:
    client-auth: need  # Require client certificate
    trust-store: classpath:truststore.p12
    trust-store-password: ${TRUSTSTORE_PASSWORD}
```

## Anti-patterns

### Trusting Client Input Without Validation

```java
// DON'T - SQL injection risk
String query = "SELECT * FROM products WHERE sku = " + request.sku();

// DO - use parameterized queries
@Query("SELECT p FROM Product p WHERE p.sku = :sku")
Mono<Product> findBySku(@Param("sku") long sku);
```

### Hardcoded Secrets

```java
// DON'T - secrets in code
private static final String API_KEY = "sk-abc123secret";
private static final String DB_PASSWORD = "admin123";

// DO - environment variables
@Value("${api.key}")
private String apiKey;
```

### Missing Header Validation

```java
// DON'T - use headers without validation
@GetMapping("/products/{sku}")
Mono<Product> getProduct(@PathVariable long sku, @RequestHeader("x-store-number") int store) {
    // Store number could be -1, 999999, etc.
    return service.getProduct(sku, store);
}

// DO - validate all headers
@GetMapping("/products/{sku}")
Mono<Product> getProduct(@PathVariable long sku, ServerHttpRequest request) {
    return validator.validate(request.getHeaders())
        .then(service.getProduct(sku));
}
```

### Exposing Sensitive Data in Logs

```java
// DON'T - log sensitive data
log.info("User {} authenticated with token {}", userId, token);
log.info("Payment processed for card {}", cardNumber);

// DO - mask sensitive data
log.info("User {} authenticated", userId);
log.info("Payment processed for card ending in {}", last4Digits);
```

### No Rate Limiting

```java
// DON'T - unlimited requests
@GetMapping("/search")
Mono<List<Product>> search(@RequestParam String query) {
    return searchService.search(query);
}

// DO - implement rate limiting
@GetMapping("/search")
@RateLimiter(name = "search-api")
Mono<List<Product>> search(@RequestParam String query) {
    return searchService.search(query);
}
```

### Overly Permissive CORS

```java
// DON'T - allow everything
@Bean
CorsConfigurationSource corsConfig() {
    CorsConfiguration config = new CorsConfiguration();
    config.addAllowedOrigin("*");
    config.addAllowedMethod("*");
    config.addAllowedHeader("*");
    // Allows any origin, method, and header!
}

// DO - restrict to known origins
@Bean
CorsConfigurationSource corsConfig() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://app.example.com"));
    config.setAllowedMethods(List.of("GET", "POST"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
}
```

### Missing Authorization Checks

```java
// DON'T - anyone can access any cart
@GetMapping("/carts/{cartId}")
Mono<Cart> getCart(@PathVariable String cartId) {
    return cartRepository.findById(cartId);
}

// DO - verify ownership
@GetMapping("/carts/{cartId}")
Mono<Cart> getCart(@PathVariable String cartId, @AuthenticationPrincipal Jwt jwt) {
    String userId = jwt.getSubject();
    return cartRepository.findById(cartId)
        .filter(cart -> cart.ownerId().equals(userId))
        .switchIfEmpty(Mono.error(new ForbiddenException()));
}
```

### Disabling Security in Production

```java
// DON'T - security disabled
@Bean
@Profile("!test")  // Also disabled in prod!
SecurityWebFilterChain noSecurity(ServerHttpSecurity http) {
    return http.authorizeExchange(e -> e.anyExchange().permitAll()).build();
}

// DO - proper profile management
@Bean
@Profile("test")  // Only for tests
SecurityWebFilterChain testSecurity(ServerHttpSecurity http) {
    return http.authorizeExchange(e -> e.anyExchange().permitAll()).build();
}

@Bean
@Profile("!test")
SecurityWebFilterChain productionSecurity(ServerHttpSecurity http) {
    // Full security configuration
}
```

## Reference

- `apps/product-service/src/.../validation/` - Header validation
- `libs/platform/platform-security/` - Security configuration (placeholder)
- `006_AUTHN_AUTHZ.md` - OAuth2 implementation plan
