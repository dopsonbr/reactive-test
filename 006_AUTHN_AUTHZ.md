# 006: OAuth2 Authentication & Authorization Implementation Plan

## Overview

This plan outlines the implementation of comprehensive OAuth2 security for the reactive-test application. The implementation includes:

1. **Inbound Request Validation** - JWT token validation for all API requests (audience, expiration, issuer)
2. **Outbound Client Credentials** - OAuth2 client credentials grant for downstream API calls
3. **Token Caching** - In-memory caching of client credentials tokens
4. **Test Support** - Fake token generation for unit/integration tests
5. **Mock OAuth Servers** - WireMock-based OAuth servers for testing

The design follows Spring Security WebFlux best practices with declarative configuration.

---

## Current State

### Security Posture
- **No authentication** - Endpoints are publicly accessible
- **No authorization** - No role or scope-based access control
- **No token validation** - Request headers are trusted without verification
- **No downstream auth** - External service calls have no authentication

### Current Request Flow
```
┌──────────────┐         ┌──────────────────────┐         ┌────────────────┐
│   Client     │ ──────► │  ProductController   │ ──────► │  Downstream    │
│              │ Headers │  (no validation)     │ No Auth │  Services      │
│              │  only   │                      │         │                │
└──────────────┘         └──────────────────────┘         └────────────────┘
```

### Relevant Files
| File | Current State |
|------|---------------|
| `ProductController.java:40-66` | Extracts headers, no token validation |
| `WebClientConfig.java` | Creates WebClient beans, no auth headers |
| `application.yml` | No OAuth configuration |
| `build.gradle` | No Spring Security dependencies |

---

## Target State

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              External OAuth Server (Issuer A)                        │
│                         (Auth0, Okta, Keycloak, Azure AD, etc.)                      │
│                              iss: https://auth.example.com                           │
└────────────────────────────────────────────┬────────────────────────────────────────┘
                                             │
                                             │ Issues JWT
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                    Client Request                                     │
│          Authorization: Bearer <JWT with aud, exp, iss, scope claims>                │
└────────────────────────────────────────────┬─────────────────────────────────────────┘
                                             │
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                        OAuth2 Resource Server Filter Chain                            │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  1. JWT Decoder (validates signature, exp, iss, aud)                            │ │
│  │  2. JwtAuthenticationConverter (extracts scopes → authorities)                  │ │
│  │  3. ReactiveSecurityContextHolder (propagates through Reactor Context)          │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────┬─────────────────────────────────────────┘
                                             │
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              ProductController                                        │
│  @PreAuthorize("hasAuthority('SCOPE_product:read')")                                 │
│  public Mono<Product> getProduct(@PathVariable long sku)                             │
└────────────────────────────────────────────┬─────────────────────────────────────────┘
                                             │
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           ProductService + Repositories                               │
│                                                                                       │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐                │
│  │ Merchandise     │     │ Price           │     │ Inventory       │                │
│  │ Repository      │     │ Repository      │     │ Repository      │                │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘                │
│           │                       │                       │                          │
└───────────┼───────────────────────┼───────────────────────┼──────────────────────────┘
            │                       │                       │
            ▼                       ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                      OAuth2 Client Credentials Filter                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  ServerOAuth2AuthorizedClientExchangeFilterFunction                             │ │
│  │  - Checks in-memory cache for valid token                                       │ │
│  │  - If expired/missing: POST /oauth/token to downstream auth server              │ │
│  │  - Adds Authorization: Bearer <token> to outbound request                       │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────┬─────────────────────────────────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           Downstream OAuth Server (Issuer B)                         │
│                              iss: https://internal-auth.example.com                  │
│                         (Separate from inbound token issuer)                         │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                             │
                                             │ Authenticated Request
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              Downstream Services                                      │
│            (merchandise, price, inventory - via WireMock in dev/test)                │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Declarative security via `@PreAuthorize` | Cleaner than programmatic checks, testable |
| Separate OAuth servers for inbound/outbound | Different trust domains, realistic enterprise pattern |
| In-memory token cache (Spring's built-in) | Simpler than Redis for short-lived tokens, automatic refresh |
| WireMock for OAuth mocks | Consistent with existing mock infrastructure |
| JWT (not opaque tokens) | Self-contained, no introspection latency |

---

## Implementation Plan

### Phase 1: Add Dependencies

**Update: `build.gradle`**

```gradle
dependencies {
    // Existing dependencies...

    // Spring Security OAuth2 Resource Server (for validating inbound JWTs)
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'

    // Spring Security OAuth2 Client (for client credentials flow to downstream services)
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'

    // Spring Security Test (for @WithMockUser, SecurityMockServerConfigurers)
    testImplementation 'org.springframework.security:spring-security-test'
}
```

---

### Phase 2: Configure OAuth2 Resource Server (Inbound Validation)

#### 2.1 Application Configuration

**Update: `src/main/resources/application.yml`**

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${OAUTH_ISSUER_URI:https://auth.example.com}
          audiences: ${OAUTH_AUDIENCE:reactive-test-api}
          # JWK Set URI is auto-discovered from issuer-uri/.well-known/openid-configuration
          # Or specify explicitly:
          # jwk-set-uri: ${OAUTH_JWKS_URI:https://auth.example.com/.well-known/jwks.json}

# Custom properties for additional validation
app:
  security:
    # Allowed issuers (for multi-tenant scenarios)
    allowed-issuers:
      - ${OAUTH_ISSUER_URI:https://auth.example.com}
    # Required audience
    required-audience: ${OAUTH_AUDIENCE:reactive-test-api}
    # Token expiration tolerance (for clock skew)
    clock-skew-seconds: 30
```

**Update: `src/main/resources/application-docker.yml`**

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # WireMock OAuth server for Docker environment
          issuer-uri: http://wiremock:8081/oauth
          jwk-set-uri: http://wiremock:8081/oauth/.well-known/jwks.json

app:
  security:
    allowed-issuers:
      - http://wiremock:8081/oauth
    required-audience: reactive-test-api
```

**New: `src/main/resources/application-test.yml`**

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # Use local mock for tests
          issuer-uri: http://localhost:8081/oauth
          jwk-set-uri: http://localhost:8081/oauth/.well-known/jwks.json

app:
  security:
    allowed-issuers:
      - http://localhost:8081/oauth
      - test-issuer  # For unit tests with fake tokens
    required-audience: reactive-test-api
```

#### 2.2 Security Configuration

**New File: `src/main/java/org/example/reactivetest/security/SecurityConfig.java`**

```java
package org.example.reactivetest.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationConverter jwtAuthenticationConverter;

    public SecurityConfig(JwtAuthenticationConverter jwtAuthenticationConverter) {
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .authorizeExchange(exchanges -> exchanges
                // Actuator endpoints - allow health checks without auth
                .pathMatchers("/actuator/health", "/actuator/health/**").permitAll()
                .pathMatchers("/actuator/info").permitAll()
                .pathMatchers("/actuator/prometheus").permitAll()
                // All other actuator endpoints require authentication
                .pathMatchers("/actuator/**").authenticated()
                // All API endpoints require authentication
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(
                        new ReactiveJwtAuthenticationConverterAdapter(jwtAuthenticationConverter)
                    )
                )
            )
            // Disable CSRF for stateless API
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .build();
    }
}
```

#### 2.3 JWT Authentication Converter (Extract Scopes)

**New File: `src/main/java/org/example/reactivetest/security/JwtAuthenticationConverter.java`**

```java
package org.example.reactivetest.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class JwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final String SCOPE_CLAIM = "scope";
    private static final String SCP_CLAIM = "scp";      // Some providers use 'scp'
    private static final String SCOPES_CLAIM = "scopes"; // Some providers use 'scopes' array

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        return Stream.of(
                extractScopeAuthorities(jwt, SCOPE_CLAIM),
                extractScopeAuthorities(jwt, SCP_CLAIM),
                extractScopesArrayAuthorities(jwt)
            )
            .flatMap(Collection::stream)
            .collect(Collectors.toSet());
    }

    private Collection<GrantedAuthority> extractScopeAuthorities(Jwt jwt, String claimName) {
        String scopeString = jwt.getClaimAsString(claimName);
        if (scopeString == null || scopeString.isBlank()) {
            return Collections.emptyList();
        }
        return Stream.of(scopeString.split("\\s+"))
            .map(scope -> new SimpleGrantedAuthority("SCOPE_" + scope))
            .collect(Collectors.toList());
    }

    private Collection<GrantedAuthority> extractScopesArrayAuthorities(Jwt jwt) {
        List<String> scopes = jwt.getClaimAsStringList(SCOPES_CLAIM);
        if (scopes == null) {
            return Collections.emptyList();
        }
        return scopes.stream()
            .map(scope -> new SimpleGrantedAuthority("SCOPE_" + scope))
            .collect(Collectors.toList());
    }
}
```

#### 2.4 Custom JWT Validator (Audience, Issuer, Expiration)

**New File: `src/main/java/org/example/reactivetest/security/JwtValidatorConfig.java`**

```java
package org.example.reactivetest.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

import java.time.Duration;
import java.util.List;

@Configuration
public class JwtValidatorConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:#{null}}")
    private String jwkSetUri;

    @Value("${app.security.allowed-issuers}")
    private List<String> allowedIssuers;

    @Value("${app.security.required-audience}")
    private String requiredAudience;

    @Value("${app.security.clock-skew-seconds:30}")
    private long clockSkewSeconds;

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        NimbusReactiveJwtDecoder decoder = NimbusReactiveJwtDecoder
            .withJwkSetUri(jwkSetUri)
            .build();

        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
            // Expiration validation with clock skew tolerance
            new JwtTimestampValidator(Duration.ofSeconds(clockSkewSeconds)),
            // Issuer validation
            issuerValidator(),
            // Audience validation
            audienceValidator()
        );

        decoder.setJwtValidator(validator);
        return decoder;
    }

    private OAuth2TokenValidator<Jwt> issuerValidator() {
        return token -> {
            String issuer = token.getClaimAsString(JwtClaimNames.ISS);
            if (issuer == null || !allowedIssuers.contains(issuer)) {
                OAuth2Error error = new OAuth2Error(
                    "invalid_token",
                    "The iss claim is not valid. Expected one of: " + allowedIssuers,
                    null
                );
                return OAuth2TokenValidatorResult.failure(error);
            }
            return OAuth2TokenValidatorResult.success();
        };
    }

    private OAuth2TokenValidator<Jwt> audienceValidator() {
        return new JwtClaimValidator<List<String>>(
            JwtClaimNames.AUD,
            aud -> aud != null && aud.contains(requiredAudience)
        );
    }
}
```

#### 2.5 Security Error Handler

**New File: `src/main/java/org/example/reactivetest/security/SecurityErrorHandler.java`**

```java
package org.example.reactivetest.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.reactivetest.error.ErrorResponse;
import org.example.reactivetest.logging.StructuredLogger;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.security.web.server.authorization.ServerAccessDeniedHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class SecurityErrorHandler implements ServerAuthenticationEntryPoint, ServerAccessDeniedHandler {

    private static final String LOGGER_NAME = "SecurityErrorHandler";

    private final ObjectMapper objectMapper;
    private final StructuredLogger structuredLogger;

    public SecurityErrorHandler(ObjectMapper objectMapper, StructuredLogger structuredLogger) {
        this.objectMapper = objectMapper;
        this.structuredLogger = structuredLogger;
    }

    @Override
    public Mono<Void> commence(ServerWebExchange exchange, AuthenticationException ex) {
        return handleError(exchange, HttpStatus.UNAUTHORIZED, "Authentication required", ex);
    }

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, AccessDeniedException ex) {
        return handleError(exchange, HttpStatus.FORBIDDEN, "Access denied", ex);
    }

    private Mono<Void> handleError(ServerWebExchange exchange, HttpStatus status,
                                    String message, Exception ex) {
        String detail = ex.getMessage();
        if (ex instanceof InvalidBearerTokenException) {
            detail = "Invalid or expired bearer token";
        }

        // Log security error
        structuredLogger.logSecurityError(LOGGER_NAME, status.value(), message, detail);

        ErrorResponse errorResponse = new ErrorResponse(
            status.value(),
            message,
            detail,
            exchange.getRequest().getPath().value()
        );

        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        try {
            byte[] bytes = objectMapper.writeValueAsBytes(errorResponse);
            DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
            return exchange.getResponse().writeWith(Mono.just(buffer));
        } catch (JsonProcessingException e) {
            return exchange.getResponse().setComplete();
        }
    }
}
```

Update `SecurityConfig.java` to use the error handler:

```java
@Bean
public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http,
                                                      SecurityErrorHandler errorHandler) {
    return http
        .authorizeExchange(exchanges -> exchanges
            .pathMatchers("/actuator/health", "/actuator/health/**").permitAll()
            .pathMatchers("/actuator/info").permitAll()
            .pathMatchers("/actuator/prometheus").permitAll()
            .pathMatchers("/actuator/**").authenticated()
            .anyExchange().authenticated()
        )
        .oauth2ResourceServer(oauth2 -> oauth2
            .jwt(jwt -> jwt
                .jwtAuthenticationConverter(
                    new ReactiveJwtAuthenticationConverterAdapter(jwtAuthenticationConverter)
                )
            )
            .authenticationEntryPoint(errorHandler)
            .accessDeniedHandler(errorHandler)
        )
        .csrf(ServerHttpSecurity.CsrfSpec::disable)
        .build();
}
```

---

### Phase 3: Add Method-Level Authorization

#### 3.1 Update ProductController with Authorization

**Update: `src/main/java/org/example/reactivetest/controller/ProductController.java`**

```java
package org.example.reactivetest.controller;

import org.example.reactivetest.domain.Product;
import org.example.reactivetest.logging.StructuredLogger;
import org.example.reactivetest.service.ProductService;
import org.example.reactivetest.validation.RequestValidator;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/products")
public class ProductController {

    private static final String LOGGER_NAME = "ProductController";

    private final ProductService productService;
    private final RequestValidator requestValidator;
    private final StructuredLogger structuredLogger;

    public ProductController(ProductService productService,
                            RequestValidator requestValidator,
                            StructuredLogger structuredLogger) {
        this.productService = productService;
        this.requestValidator = requestValidator;
        this.structuredLogger = structuredLogger;
    }

    @GetMapping("/{sku}")
    @PreAuthorize("hasAuthority('SCOPE_product:read')")
    public Mono<Product> getProduct(
        @PathVariable long sku,
        @RequestHeader("x-store-number") int storeNumber,
        @RequestHeader("x-order-number") String orderNumber,
        @RequestHeader("x-userid") String userId,
        @RequestHeader("x-sessionid") String sessionId,
        @AuthenticationPrincipal Jwt jwt  // Access JWT claims if needed
    ) {
        // Log authenticated request with subject
        String subject = jwt.getSubject();
        structuredLogger.logAuthenticatedRequest(LOGGER_NAME, subject, sku);

        return requestValidator.validateProductRequest(sku, storeNumber, orderNumber, userId, sessionId)
            .then(productService.getProduct(sku));
    }
}
```

---

### Phase 4: Configure OAuth2 Client Credentials (Outbound Auth)

#### 4.1 Application Configuration for Client Credentials

**Update: `src/main/resources/application.yml`**

```yaml
spring:
  security:
    oauth2:
      # Resource server config (existing from Phase 2)
      resourceserver:
        jwt:
          issuer-uri: ${OAUTH_ISSUER_URI:https://auth.example.com}
          audiences: ${OAUTH_AUDIENCE:reactive-test-api}

      # Client credentials config for downstream services
      client:
        registration:
          # Client for downstream service authentication
          downstream-services:
            client-id: ${DOWNSTREAM_CLIENT_ID:reactive-test-client}
            client-secret: ${DOWNSTREAM_CLIENT_SECRET:secret}
            authorization-grant-type: client_credentials
            scope: merchandise:read,price:read,inventory:read
            provider: downstream-auth

        provider:
          downstream-auth:
            # Different issuer than inbound tokens
            token-uri: ${DOWNSTREAM_TOKEN_URI:https://internal-auth.example.com/oauth/token}
```

**Update: `src/main/resources/application-docker.yml`**

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://wiremock:8081/oauth
          jwk-set-uri: http://wiremock:8081/oauth/.well-known/jwks.json

      client:
        registration:
          downstream-services:
            client-id: reactive-test-client
            client-secret: test-secret
            authorization-grant-type: client_credentials
            scope: merchandise:read,price:read,inventory:read
            provider: downstream-auth

        provider:
          downstream-auth:
            # Different WireMock endpoint for downstream auth
            token-uri: http://wiremock:8081/downstream-oauth/token
```

#### 4.2 OAuth2 Client Configuration

**New File: `src/main/java/org/example/reactivetest/security/OAuth2ClientConfig.java`**

```java
package org.example.reactivetest.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.InMemoryReactiveOAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.ReactiveOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.ReactiveOAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.reactive.function.client.ServerOAuth2AuthorizedClientExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;

@Configuration
public class OAuth2ClientConfig {

    /**
     * In-memory cache for authorized clients (tokens).
     * Tokens are cached until they expire, then automatically refreshed.
     */
    @Bean
    public ReactiveOAuth2AuthorizedClientService authorizedClientService(
            ReactiveClientRegistrationRepository clientRegistrationRepository) {
        return new InMemoryReactiveOAuth2AuthorizedClientService(clientRegistrationRepository);
    }

    /**
     * Manages OAuth2 client credentials flow.
     * Uses AuthorizedClientService for token caching.
     */
    @Bean
    public ReactiveOAuth2AuthorizedClientManager authorizedClientManager(
            ReactiveClientRegistrationRepository clientRegistrationRepository,
            ReactiveOAuth2AuthorizedClientService authorizedClientService) {
        return new AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager(
            clientRegistrationRepository,
            authorizedClientService
        );
    }

    /**
     * Exchange filter function that adds OAuth2 bearer token to outbound requests.
     * Automatically handles token acquisition and refresh.
     */
    @Bean
    public ExchangeFilterFunction oauth2Filter(
            ReactiveOAuth2AuthorizedClientManager authorizedClientManager) {
        ServerOAuth2AuthorizedClientExchangeFilterFunction filter =
            new ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);

        // Use client_credentials registration for all requests
        filter.setDefaultClientRegistrationId("downstream-services");

        return filter;
    }
}
```

#### 4.3 Update WebClient Configuration

**Update: `src/main/java/org/example/reactivetest/config/WebClientConfig.java`**

```java
package org.example.reactivetest.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${app.services.merchandise.base-url}")
    private String merchandiseBaseUrl;

    @Value("${app.services.price.base-url}")
    private String priceBaseUrl;

    @Value("${app.services.inventory.base-url}")
    private String inventoryBaseUrl;

    private final WebClientLoggingFilter loggingFilter;
    private final ExchangeFilterFunction oauth2Filter;

    public WebClientConfig(WebClientLoggingFilter loggingFilter,
                          @Qualifier("oauth2Filter") ExchangeFilterFunction oauth2Filter) {
        this.loggingFilter = loggingFilter;
        this.oauth2Filter = oauth2Filter;
    }

    @Bean
    public WebClient merchandiseWebClient() {
        return WebClient.builder()
            .baseUrl(merchandiseBaseUrl)
            .filter(oauth2Filter)  // Add OAuth2 token
            .filter(loggingFilter.create("MerchandiseRepository"))
            .build();
    }

    @Bean
    public WebClient priceWebClient() {
        return WebClient.builder()
            .baseUrl(priceBaseUrl)
            .filter(oauth2Filter)  // Add OAuth2 token
            .filter(loggingFilter.create("PriceRepository"))
            .build();
    }

    @Bean
    public WebClient inventoryWebClient() {
        return WebClient.builder()
            .baseUrl(inventoryBaseUrl)
            .filter(oauth2Filter)  // Add OAuth2 token
            .filter(loggingFilter.create("InventoryRepository"))
            .build();
    }
}
```

---

### Phase 5: WireMock OAuth Server Mocks

#### 5.1 Inbound OAuth Server (Token Validation)

**New File: `perf-test/wiremock/mappings/oauth/jwks.json`**

```json
{
  "mappings": [
    {
      "name": "JWKS Endpoint",
      "request": {
        "method": "GET",
        "urlPath": "/oauth/.well-known/jwks.json"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "keys": [
            {
              "kty": "RSA",
              "kid": "test-key-1",
              "use": "sig",
              "alg": "RS256",
              "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
              "e": "AQAB"
            }
          ]
        }
      }
    },
    {
      "name": "OpenID Configuration",
      "request": {
        "method": "GET",
        "urlPath": "/oauth/.well-known/openid-configuration"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "issuer": "http://wiremock:8081/oauth",
          "authorization_endpoint": "http://wiremock:8081/oauth/authorize",
          "token_endpoint": "http://wiremock:8081/oauth/token",
          "jwks_uri": "http://wiremock:8081/oauth/.well-known/jwks.json",
          "response_types_supported": ["code", "token"],
          "subject_types_supported": ["public"],
          "id_token_signing_alg_values_supported": ["RS256"]
        }
      }
    }
  ]
}
```

#### 5.2 Downstream OAuth Server (Client Credentials)

**New File: `perf-test/wiremock/mappings/downstream-oauth/token.json`**

```json
{
  "mappings": [
    {
      "name": "Client Credentials Token Endpoint",
      "request": {
        "method": "POST",
        "urlPath": "/downstream-oauth/token",
        "headers": {
          "Content-Type": {
            "contains": "application/x-www-form-urlencoded"
          }
        },
        "bodyPatterns": [
          {
            "contains": "grant_type=client_credentials"
          }
        ]
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRvd25zdHJlYW0ta2V5LTEifQ.eyJpc3MiOiJodHRwOi8vd2lyZW1vY2s6ODA4MS9kb3duc3RyZWFtLW9hdXRoIiwic3ViIjoicmVhY3RpdmUtdGVzdC1jbGllbnQiLCJhdWQiOiJkb3duc3RyZWFtLXNlcnZpY2VzIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDQxNTM2MDAsInNjb3BlIjoibWVyY2hhbmRpc2U6cmVhZCBwcmljZTpyZWFkIGludmVudG9yeTpyZWFkIn0.mock-signature",
          "token_type": "Bearer",
          "expires_in": 3600,
          "scope": "merchandise:read price:read inventory:read"
        }
      }
    },
    {
      "name": "Client Credentials Token Endpoint - Invalid Client",
      "priority": 1,
      "request": {
        "method": "POST",
        "urlPath": "/downstream-oauth/token",
        "bodyPatterns": [
          {
            "contains": "client_id=invalid"
          }
        ]
      },
      "response": {
        "status": 401,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "error": "invalid_client",
          "error_description": "Client authentication failed"
        }
      }
    }
  ]
}
```

#### 5.3 Downstream OAuth Server - Chaos Scenarios

**New File: `perf-test/wiremock/mappings/downstream-oauth/token-chaos.json`**

```json
{
  "mappings": [
    {
      "name": "Token Endpoint - Timeout Scenario",
      "scenarioName": "downstream-oauth-chaos",
      "requiredScenarioState": "timeout",
      "request": {
        "method": "POST",
        "urlPath": "/downstream-oauth/token"
      },
      "response": {
        "status": 200,
        "fixedDelayMilliseconds": 5000,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "access_token": "delayed-token",
          "token_type": "Bearer",
          "expires_in": 3600
        }
      }
    },
    {
      "name": "Token Endpoint - 500 Error Scenario",
      "scenarioName": "downstream-oauth-chaos",
      "requiredScenarioState": "error-500",
      "request": {
        "method": "POST",
        "urlPath": "/downstream-oauth/token"
      },
      "response": {
        "status": 500,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "error": "server_error",
          "error_description": "Internal server error"
        }
      }
    },
    {
      "name": "Token Endpoint - 503 Service Unavailable",
      "scenarioName": "downstream-oauth-chaos",
      "requiredScenarioState": "error-503",
      "request": {
        "method": "POST",
        "urlPath": "/downstream-oauth/token"
      },
      "response": {
        "status": 503,
        "headers": {
          "Content-Type": "application/json",
          "Retry-After": "5"
        },
        "jsonBody": {
          "error": "temporarily_unavailable",
          "error_description": "Service temporarily unavailable"
        }
      }
    },
    {
      "name": "Token Endpoint - Expired Token Scenario",
      "scenarioName": "downstream-oauth-chaos",
      "requiredScenarioState": "expired-token",
      "request": {
        "method": "POST",
        "urlPath": "/downstream-oauth/token"
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "access_token": "expired-token",
          "token_type": "Bearer",
          "expires_in": 1
        }
      }
    }
  ]
}
```

---

### Phase 6: Test Support - Fake Token Generation

#### 6.1 Test JWT Builder

**New File: `src/test/java/org/example/reactivetest/security/TestJwtBuilder.java`**

```java
package org.example.reactivetest.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Utility class for generating test JWT tokens.
 * Use this to create fake tokens for unit and integration tests.
 */
public class TestJwtBuilder {

    private static final KeyPair KEY_PAIR = generateKeyPair();

    private String issuer = "test-issuer";
    private String subject = "test-user";
    private List<String> audience = List.of("reactive-test-api");
    private Instant issuedAt = Instant.now();
    private Instant expiration = Instant.now().plusSeconds(3600);
    private String scope = "product:read";
    private Map<String, Object> additionalClaims = new HashMap<>();

    public static TestJwtBuilder builder() {
        return new TestJwtBuilder();
    }

    public static PublicKey getPublicKey() {
        return KEY_PAIR.getPublic();
    }

    public static PrivateKey getPrivateKey() {
        return KEY_PAIR.getPrivate();
    }

    public TestJwtBuilder issuer(String issuer) {
        this.issuer = issuer;
        return this;
    }

    public TestJwtBuilder subject(String subject) {
        this.subject = subject;
        return this;
    }

    public TestJwtBuilder audience(String... audiences) {
        this.audience = List.of(audiences);
        return this;
    }

    public TestJwtBuilder issuedAt(Instant issuedAt) {
        this.issuedAt = issuedAt;
        return this;
    }

    public TestJwtBuilder expiresAt(Instant expiration) {
        this.expiration = expiration;
        return this;
    }

    public TestJwtBuilder expiresIn(long seconds) {
        this.expiration = Instant.now().plusSeconds(seconds);
        return this;
    }

    public TestJwtBuilder expired() {
        this.expiration = Instant.now().minusSeconds(3600);
        return this;
    }

    public TestJwtBuilder scope(String scope) {
        this.scope = scope;
        return this;
    }

    public TestJwtBuilder scopes(String... scopes) {
        this.scope = String.join(" ", scopes);
        return this;
    }

    public TestJwtBuilder claim(String name, Object value) {
        this.additionalClaims.put(name, value);
        return this;
    }

    public String build() {
        return Jwts.builder()
            .setIssuer(issuer)
            .setSubject(subject)
            .setAudience(String.join(",", audience))
            .setIssuedAt(Date.from(issuedAt))
            .setExpiration(Date.from(expiration))
            .setId(UUID.randomUUID().toString())
            .claim("scope", scope)
            .addClaims(additionalClaims)
            .signWith(KEY_PAIR.getPrivate(), SignatureAlgorithm.RS256)
            .compact();
    }

    private static KeyPair generateKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to generate RSA key pair", e);
        }
    }
}
```

#### 6.2 Test Security Configuration

**New File: `src/test/java/org/example/reactivetest/security/TestSecurityConfig.java`**

```java
package org.example.reactivetest.security;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

/**
 * Test configuration that uses the test key pair for JWT validation.
 * Apply to integration tests that need to validate tokens.
 */
@TestConfiguration
public class TestSecurityConfig {

    @Bean
    @Primary
    public ReactiveJwtDecoder testJwtDecoder() {
        return NimbusReactiveJwtDecoder
            .withPublicKey((java.security.interfaces.RSAPublicKey) TestJwtBuilder.getPublicKey())
            .build();
    }
}
```

#### 6.3 Security Test Utilities

**New File: `src/test/java/org/example/reactivetest/security/SecurityTestUtils.java`**

```java
package org.example.reactivetest.security;

import org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.function.Consumer;

/**
 * Utilities for security testing.
 */
public class SecurityTestUtils {

    /**
     * Creates a mutator that adds a valid JWT bearer token to requests.
     */
    public static Consumer<WebTestClient.RequestHeadersSpec<?>> withBearerToken(String... scopes) {
        String token = TestJwtBuilder.builder()
            .scopes(scopes)
            .build();
        return request -> request.header("Authorization", "Bearer " + token);
    }

    /**
     * Creates a mutator that adds an expired JWT bearer token to requests.
     */
    public static Consumer<WebTestClient.RequestHeadersSpec<?>> withExpiredToken() {
        String token = TestJwtBuilder.builder()
            .expired()
            .build();
        return request -> request.header("Authorization", "Bearer " + token);
    }

    /**
     * Creates a mutator that adds a token with wrong audience.
     */
    public static Consumer<WebTestClient.RequestHeadersSpec<?>> withWrongAudience() {
        String token = TestJwtBuilder.builder()
            .audience("wrong-audience")
            .build();
        return request -> request.header("Authorization", "Bearer " + token);
    }

    /**
     * Creates a mutator that adds a token with wrong issuer.
     */
    public static Consumer<WebTestClient.RequestHeadersSpec<?>> withWrongIssuer() {
        String token = TestJwtBuilder.builder()
            .issuer("wrong-issuer")
            .build();
        return request -> request.header("Authorization", "Bearer " + token);
    }
}
```

---

### Phase 7: Unit Tests

#### 7.1 JWT Authentication Converter Tests

**New File: `src/test/java/org/example/reactivetest/security/JwtAuthenticationConverterTest.java`**

```java
package org.example.reactivetest.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class JwtAuthenticationConverterTest {

    private JwtAuthenticationConverter converter;

    @BeforeEach
    void setUp() {
        converter = new JwtAuthenticationConverter();
    }

    @Test
    void shouldExtractScopesFromSpaceDelimitedClaim() {
        Jwt jwt = createJwt(Map.of("scope", "product:read product:write"));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(extractAuthorities(token))
            .containsExactlyInAnyOrder("SCOPE_product:read", "SCOPE_product:write");
    }

    @Test
    void shouldExtractScopesFromScpClaim() {
        Jwt jwt = createJwt(Map.of("scp", "product:read"));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(extractAuthorities(token))
            .contains("SCOPE_product:read");
    }

    @Test
    void shouldExtractScopesFromScopesArrayClaim() {
        Jwt jwt = createJwt(Map.of("scopes", List.of("product:read", "inventory:read")));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(extractAuthorities(token))
            .containsExactlyInAnyOrder("SCOPE_product:read", "SCOPE_inventory:read");
    }

    @Test
    void shouldReturnEmptyAuthoritiesWhenNoScopes() {
        Jwt jwt = createJwt(Map.of());

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(token.getAuthorities()).isEmpty();
    }

    @Test
    void shouldSetSubjectAsPrincipalName() {
        Jwt jwt = createJwt(Map.of("sub", "user123"));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(token.getName()).isEqualTo("user123");
    }

    private Jwt createJwt(Map<String, Object> claims) {
        return Jwt.withTokenValue("test-token")
            .header("alg", "RS256")
            .claim("sub", claims.getOrDefault("sub", "test-user"))
            .claims(c -> c.putAll(claims))
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600))
            .build();
    }

    private List<String> extractAuthorities(JwtAuthenticationToken token) {
        return token.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toList());
    }
}
```

#### 7.2 Controller Authorization Tests

**New File: `src/test/java/org/example/reactivetest/controller/ProductControllerSecurityTest.java`**

```java
package org.example.reactivetest.controller;

import org.example.reactivetest.domain.Product;
import org.example.reactivetest.security.TestJwtBuilder;
import org.example.reactivetest.security.TestSecurityConfig;
import org.example.reactivetest.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureWebTestClient
@Import(TestSecurityConfig.class)
class ProductControllerSecurityTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private ProductService productService;

    @Test
    void shouldReturn401WhenNoToken() {
        webTestClient.get()
            .uri("/products/12345")
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    void shouldReturn401WhenTokenExpired() {
        String expiredToken = TestJwtBuilder.builder()
            .expired()
            .scope("product:read")
            .build();

        webTestClient.get()
            .uri("/products/12345")
            .header("Authorization", "Bearer " + expiredToken)
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    void shouldReturn403WhenMissingScope() {
        String tokenWithWrongScope = TestJwtBuilder.builder()
            .scope("other:read")  // Wrong scope
            .build();

        webTestClient.get()
            .uri("/products/12345")
            .header("Authorization", "Bearer " + tokenWithWrongScope)
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isForbidden();
    }

    @Test
    void shouldReturn200WithValidToken() {
        Product product = new Product(12345L, "Test Product", "19.99", 10);
        when(productService.getProduct(anyLong())).thenReturn(Mono.just(product));

        String validToken = TestJwtBuilder.builder()
            .scope("product:read")
            .build();

        webTestClient.get()
            .uri("/products/12345")
            .header("Authorization", "Bearer " + validToken)
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.sku").isEqualTo(12345);
    }

    @Test
    void shouldAllowHealthEndpointWithoutAuth() {
        webTestClient.get()
            .uri("/actuator/health")
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    void shouldAllowPrometheusEndpointWithoutAuth() {
        webTestClient.get()
            .uri("/actuator/prometheus")
            .exchange()
            .expectStatus().isOk();
    }
}
```

#### 7.3 OAuth2 Client Token Caching Tests

**New File: `src/test/java/org/example/reactivetest/security/OAuth2ClientCacheTest.java`**

```java
package org.example.reactivetest.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.client.ReactiveOAuth2AuthorizedClientService;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Import(TestSecurityConfig.class)
class OAuth2ClientCacheTest {

    @Autowired
    private ReactiveOAuth2AuthorizedClientService authorizedClientService;

    @Test
    void shouldUseInMemoryAuthorizedClientService() {
        // Verify in-memory client service is configured
        assertThat(authorizedClientService)
            .isInstanceOf(org.springframework.security.oauth2.client.InMemoryReactiveOAuth2AuthorizedClientService.class);
    }
}
```

---

### Phase 8: Integration Tests

#### 8.1 OAuth Flow Integration Test

**New File: `src/test/java/org/example/reactivetest/integration/OAuth2IntegrationTest.java`**

```java
package org.example.reactivetest.integration;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.example.reactivetest.security.TestJwtBuilder;
import org.example.reactivetest.security.TestSecurityConfig;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import static com.github.tomakehurst.wiremock.client.WireMock.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@Import(TestSecurityConfig.class)
class OAuth2IntegrationTest {

    private static WireMockServer wireMockServer;

    @Autowired
    private WebTestClient webTestClient;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        wireMockServer = new WireMockServer(0);
        wireMockServer.start();

        registry.add("app.services.merchandise.base-url", () -> wireMockServer.baseUrl());
        registry.add("app.services.price.base-url", () -> wireMockServer.baseUrl());
        registry.add("app.services.inventory.base-url", () -> wireMockServer.baseUrl());
        registry.add("spring.security.oauth2.client.provider.downstream-auth.token-uri",
            () -> wireMockServer.baseUrl() + "/downstream-oauth/token");
    }

    @BeforeEach
    void setUp() {
        wireMockServer.resetAll();
        setupDownstreamOAuthMock();
        setupDownstreamServiceMocks();
    }

    @AfterEach
    void tearDown() {
        wireMockServer.stop();
    }

    @Test
    void shouldAuthenticateAndCallDownstreamServices() {
        String validToken = TestJwtBuilder.builder()
            .scope("product:read")
            .build();

        webTestClient.get()
            .uri("/products/12345")
            .header("Authorization", "Bearer " + validToken)
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.sku").isEqualTo(12345);

        // Verify downstream services received Bearer token
        wireMockServer.verify(getRequestedFor(urlPathEqualTo("/merchandise/12345"))
            .withHeader("Authorization", matching("Bearer .*")));
    }

    @Test
    void shouldCacheDownstreamTokenBetweenRequests() {
        String validToken = TestJwtBuilder.builder()
            .scope("product:read")
            .build();

        // First request
        webTestClient.get()
            .uri("/products/12345")
            .header("Authorization", "Bearer " + validToken)
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isOk();

        // Second request
        webTestClient.get()
            .uri("/products/67890")
            .header("Authorization", "Bearer " + validToken)
            .header("x-store-number", "100")
            .header("x-order-number", "550e8400-e29b-41d4-a716-446655440000")
            .header("x-userid", "user01")
            .header("x-sessionid", "550e8400-e29b-41d4-a716-446655440000")
            .exchange()
            .expectStatus().isOk();

        // Should only call token endpoint once (token cached)
        wireMockServer.verify(1, postRequestedFor(urlPathEqualTo("/downstream-oauth/token")));
    }

    private void setupDownstreamOAuthMock() {
        wireMockServer.stubFor(post(urlPathEqualTo("/downstream-oauth/token"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {
                        "access_token": "downstream-access-token",
                        "token_type": "Bearer",
                        "expires_in": 3600,
                        "scope": "merchandise:read price:read inventory:read"
                    }
                    """)));
    }

    private void setupDownstreamServiceMocks() {
        wireMockServer.stubFor(get(urlPathMatching("/merchandise/.*"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {"description": "Test Product Description"}
                    """)));

        wireMockServer.stubFor(post(urlPathEqualTo("/price"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {"price": "29.99"}
                    """)));

        wireMockServer.stubFor(post(urlPathEqualTo("/inventory"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {"availableQuantity": 50}
                    """)));
    }
}
```

---

### Phase 9: Chaos Test Plan (K6)

#### 9.1 OAuth Chaos Test Script

**New File: `perf-test/k6/oauth-chaos-test.js`**

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const authFailures = new Rate('auth_failures');
const tokenRefreshCount = new Counter('token_refresh_count');
const tokenRefreshLatency = new Trend('token_refresh_latency');

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const WIREMOCK_URL = __ENV.WIREMOCK_URL || 'http://localhost:8081';

// Chaos states
const CHAOS_STATES = {
    NORMAL: 'Started',
    TIMEOUT: 'timeout',
    ERROR_500: 'error-500',
    ERROR_503: 'error-503',
    EXPIRED_TOKEN: 'expired-token'
};

export const options = {
    scenarios: {
        // Phase 1: Baseline (normal operations)
        baseline: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '0s',
            tags: { phase: 'baseline' }
        },
        // Phase 2: Downstream OAuth timeout
        oauth_timeout: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '30s',
            tags: { phase: 'oauth_timeout' },
            exec: 'chaosPhase'
        },
        // Phase 3: Downstream OAuth 500 errors
        oauth_error_500: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '60s',
            tags: { phase: 'oauth_error_500' },
            exec: 'chaosPhase'
        },
        // Phase 4: Downstream OAuth 503 service unavailable
        oauth_error_503: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '90s',
            tags: { phase: 'oauth_error_503' },
            exec: 'chaosPhase'
        },
        // Phase 5: Expired tokens from downstream
        expired_tokens: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '120s',
            tags: { phase: 'expired_tokens' },
            exec: 'chaosPhase'
        },
        // Phase 6: Recovery
        recovery: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '150s',
            tags: { phase: 'recovery' }
        }
    },
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        auth_failures: ['rate<0.1'], // Less than 10% auth failures in normal operation
        http_req_failed: ['rate<0.3'] // Allow higher failure rate during chaos
    }
};

// Generate a mock JWT token for testing
function generateTestToken() {
    // In real tests, this would be a valid JWT from your test OAuth server
    // For now, using a placeholder that WireMock can validate
    return 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0LWlzc3VlciIsInN1YiI6InRlc3QtdXNlciIsImF1ZCI6InJlYWN0aXZlLXRlc3QtYXBpIiwic2NvcGUiOiJwcm9kdWN0OnJlYWQiLCJleHAiOjk5OTk5OTk5OTl9.mock-signature';
}

// Set chaos state via WireMock
function setChaosState(scenario, state) {
    const response = http.put(
        `${WIREMOCK_URL}/__admin/scenarios/${scenario}/state`,
        JSON.stringify({ state: state }),
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response.status === 200;
}

// Reset all chaos scenarios
function resetChaos() {
    setChaosState('downstream-oauth-chaos', CHAOS_STATES.NORMAL);
}

// Setup function - runs once before tests
export function setup() {
    resetChaos();
    console.log('OAuth Chaos Test - Starting');
}

// Teardown function - runs once after tests
export function teardown() {
    resetChaos();
    console.log('OAuth Chaos Test - Complete');
}

// Default function for baseline and recovery phases
export default function() {
    makeAuthenticatedRequest();
}

// Chaos phase executor
export function chaosPhase() {
    const phase = __ENV.K6_SCENARIO_NAME;

    // Set appropriate chaos state based on phase
    switch(phase) {
        case 'oauth_timeout':
            setChaosState('downstream-oauth-chaos', CHAOS_STATES.TIMEOUT);
            break;
        case 'oauth_error_500':
            setChaosState('downstream-oauth-chaos', CHAOS_STATES.ERROR_500);
            break;
        case 'oauth_error_503':
            setChaosState('downstream-oauth-chaos', CHAOS_STATES.ERROR_503);
            break;
        case 'expired_tokens':
            setChaosState('downstream-oauth-chaos', CHAOS_STATES.EXPIRED_TOKEN);
            break;
    }

    makeAuthenticatedRequest();
}

function makeAuthenticatedRequest() {
    const token = generateTestToken();
    const sku = Math.floor(Math.random() * 100000);

    const params = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'x-store-number': '100',
            'x-order-number': '550e8400-e29b-41d4-a716-446655440000',
            'x-userid': 'user01',
            'x-sessionid': '550e8400-e29b-41d4-a716-446655440000'
        }
    };

    const response = http.get(`${BASE_URL}/products/${sku}`, params);

    // Track auth failures
    if (response.status === 401 || response.status === 403) {
        authFailures.add(1);
    } else {
        authFailures.add(0);
    }

    check(response, {
        'is successful or gracefully degraded': (r) =>
            r.status === 200 || r.status === 503 || r.status === 504,
        'has valid response body': (r) =>
            r.status !== 200 || (r.json() && r.json().sku)
    });

    sleep(0.1);
}
```

#### 9.2 OAuth Circuit Breaker Test

**New File: `perf-test/k6/oauth-circuit-breaker-test.js`**

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const WIREMOCK_URL = __ENV.WIREMOCK_URL || 'http://localhost:8081';

const circuitOpenEvents = new Counter('circuit_open_events');
const fallbackResponses = new Counter('fallback_responses');

export const options = {
    scenarios: {
        // Phase 1: Warmup - establish baseline
        warmup: {
            executor: 'constant-vus',
            vus: 5,
            duration: '20s',
            startTime: '0s',
            tags: { phase: 'warmup' }
        },
        // Phase 2: Trigger circuit breaker by failing downstream OAuth
        trigger_circuit: {
            executor: 'constant-vus',
            vus: 20,
            duration: '30s',
            startTime: '20s',
            tags: { phase: 'trigger' },
            exec: 'triggerCircuit'
        },
        // Phase 3: Verify circuit is open (fast failures)
        verify_open: {
            executor: 'constant-vus',
            vus: 10,
            duration: '15s',
            startTime: '50s',
            tags: { phase: 'verify_open' },
            exec: 'verifyOpen'
        },
        // Phase 4: Heal downstream, allow circuit recovery
        heal: {
            executor: 'constant-vus',
            vus: 5,
            duration: '20s',
            startTime: '65s',
            tags: { phase: 'heal' },
            exec: 'healPhase'
        },
        // Phase 5: Verify recovery
        verify_recovery: {
            executor: 'constant-vus',
            vus: 10,
            duration: '20s',
            startTime: '85s',
            tags: { phase: 'verify_recovery' }
        }
    },
    thresholds: {
        // During trigger phase, expect failures
        'http_req_duration{phase:verify_open}': ['p(95)<100'], // Fast fail when circuit open
        'http_req_duration{phase:verify_recovery}': ['p(95)<500'] // Should recover
    }
};

function generateTestToken() {
    return 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
}

function setChaosState(scenario, state) {
    http.put(
        `${WIREMOCK_URL}/__admin/scenarios/${scenario}/state`,
        JSON.stringify({ state: state }),
        { headers: { 'Content-Type': 'application/json' } }
    );
}

export function setup() {
    setChaosState('downstream-oauth-chaos', 'Started');
    console.log('OAuth Circuit Breaker Test - Starting');
}

export function teardown() {
    setChaosState('downstream-oauth-chaos', 'Started');
    console.log('OAuth Circuit Breaker Test - Complete');
}

export default function() {
    makeRequest();
}

export function triggerCircuit() {
    // Set downstream OAuth to fail
    setChaosState('downstream-oauth-chaos', 'error-500');
    makeRequest();
}

export function verifyOpen() {
    // Circuit should be open - expect fast failures
    const startTime = Date.now();
    const response = makeRequest();
    const duration = Date.now() - startTime;

    // If response is very fast, circuit is likely open
    if (duration < 50 && (response.status === 503 || response.status === 504)) {
        circuitOpenEvents.add(1);
    }
}

export function healPhase() {
    // Restore downstream OAuth
    setChaosState('downstream-oauth-chaos', 'Started');
    makeRequest();
}

function makeRequest() {
    const token = generateTestToken();
    const sku = Math.floor(Math.random() * 100000);

    const params = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'x-store-number': '100',
            'x-order-number': '550e8400-e29b-41d4-a716-446655440000',
            'x-userid': 'user01',
            'x-sessionid': '550e8400-e29b-41d4-a716-446655440000'
        }
    };

    const response = http.get(`${BASE_URL}/products/${sku}`, params);

    // Check for fallback responses
    if (response.status === 200 && response.json()) {
        const body = response.json();
        if (body.price === '0.00' || body.description === 'Description unavailable') {
            fallbackResponses.add(1);
        }
    }

    check(response, {
        'not a 5xx error or graceful degradation': (r) =>
            r.status < 500 || r.status === 503 || r.status === 504
    });

    sleep(0.05);
    return response;
}
```

---

### Phase 10: Update Docker Compose

**Update: `docker/docker-compose.yml`**

Add new profile for OAuth testing:

```yaml
services:
  # ... existing services ...

  reactive-test:
    # ... existing config ...
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      # OAuth Resource Server
      - OAUTH_ISSUER_URI=http://wiremock:8081/oauth
      - OAUTH_AUDIENCE=reactive-test-api
      # OAuth Client Credentials
      - DOWNSTREAM_CLIENT_ID=reactive-test-client
      - DOWNSTREAM_CLIENT_SECRET=test-secret
      - DOWNSTREAM_TOKEN_URI=http://wiremock:8081/downstream-oauth/token
      # ... existing env vars ...

  # K6 OAuth Chaos Test
  k6-oauth-chaos:
    image: grafana/k6:latest
    profiles: ["oauth-chaos"]
    volumes:
      - ../perf-test/k6:/scripts
    environment:
      - BASE_URL=http://reactive-test:8080
      - WIREMOCK_URL=http://wiremock:8081
    command: run /scripts/oauth-chaos-test.js
    depends_on:
      - reactive-test
      - wiremock

  # K6 OAuth Circuit Breaker Test
  k6-oauth-circuit-breaker:
    image: grafana/k6:latest
    profiles: ["oauth-chaos"]
    volumes:
      - ../perf-test/k6:/scripts
    environment:
      - BASE_URL=http://reactive-test:8080
      - WIREMOCK_URL=http://wiremock:8081
    command: run /scripts/oauth-circuit-breaker-test.js
    depends_on:
      - reactive-test
      - wiremock
```

---

### Phase 11: Update Logging

#### 11.1 Add Security Logging Methods

**Update: `src/main/java/org/example/reactivetest/logging/StructuredLogger.java`**

Add new methods for security event logging:

```java
public void logSecurityError(String loggerName, int status, String error, String detail) {
    SecurityErrorLogData data = new SecurityErrorLogData(status, error, detail);
    log(loggerName, "warn", data);
}

public void logAuthenticatedRequest(String loggerName, String subject, long sku) {
    AuthenticatedRequestLogData data = new AuthenticatedRequestLogData(subject, sku);
    log(loggerName, "info", data);
}

public void logTokenRefresh(String loggerName, String clientRegistrationId, boolean success) {
    TokenRefreshLogData data = new TokenRefreshLogData(clientRegistrationId, success);
    log(loggerName, "info", data);
}
```

**New File: `src/main/java/org/example/reactivetest/logging/SecurityErrorLogData.java`**

```java
package org.example.reactivetest.logging;

public record SecurityErrorLogData(
    int status,
    String error,
    String detail
) {}
```

**New File: `src/main/java/org/example/reactivetest/logging/AuthenticatedRequestLogData.java`**

```java
package org.example.reactivetest.logging;

public record AuthenticatedRequestLogData(
    String subject,
    long sku
) {}
```

**New File: `src/main/java/org/example/reactivetest/logging/TokenRefreshLogData.java`**

```java
package org.example.reactivetest.logging;

public record TokenRefreshLogData(
    String clientRegistrationId,
    boolean success
) {}
```

---

## Files Summary

### New Files

| File | Purpose |
|------|---------|
| `security/SecurityConfig.java` | Main security configuration with OAuth2 resource server |
| `security/JwtAuthenticationConverter.java` | Extracts scopes from JWT claims |
| `security/JwtValidatorConfig.java` | Custom validators for audience, issuer, expiration |
| `security/OAuth2ClientConfig.java` | Client credentials configuration with in-memory caching |
| `security/SecurityErrorHandler.java` | Handles 401/403 with structured error responses |
| `logging/SecurityErrorLogData.java` | Security error log data model |
| `logging/AuthenticatedRequestLogData.java` | Authenticated request log data model |
| `logging/TokenRefreshLogData.java` | Token refresh log data model |
| `perf-test/wiremock/mappings/oauth/jwks.json` | JWKS endpoint mock |
| `perf-test/wiremock/mappings/downstream-oauth/token.json` | Downstream token endpoint mock |
| `perf-test/wiremock/mappings/downstream-oauth/token-chaos.json` | Chaos scenarios for OAuth |
| `perf-test/k6/oauth-chaos-test.js` | OAuth chaos test script |
| `perf-test/k6/oauth-circuit-breaker-test.js` | OAuth circuit breaker test |
| `test/security/TestJwtBuilder.java` | Test JWT token generator |
| `test/security/TestSecurityConfig.java` | Test security configuration |
| `test/security/SecurityTestUtils.java` | Security test utilities |
| `test/security/JwtAuthenticationConverterTest.java` | Unit tests for JWT converter |
| `test/controller/ProductControllerSecurityTest.java` | Controller security tests |
| `test/security/OAuth2ClientCacheTest.java` | Token caching tests |
| `test/integration/OAuth2IntegrationTest.java` | Full OAuth flow integration test |

### Modified Files

| File | Changes |
|------|---------|
| `build.gradle` | Add Spring Security OAuth2 dependencies |
| `application.yml` | Add OAuth2 resource server and client configuration |
| `application-docker.yml` | Add Docker-specific OAuth configuration |
| `controller/ProductController.java` | Add `@PreAuthorize` and JWT principal |
| `config/WebClientConfig.java` | Add OAuth2 filter to WebClient beans |
| `logging/StructuredLogger.java` | Add security logging methods |
| `docker/docker-compose.yml` | Add OAuth chaos test profiles |

---

## Migration Checklist

### Phase 1: Dependencies
- [x] Add `spring-boot-starter-oauth2-resource-server` to `build.gradle`
- [x] Add `spring-boot-starter-oauth2-client` to `build.gradle`
- [x] Add `spring-security-test` to test dependencies
- [x] Add JJWT library for test token generation

### Phase 2: Resource Server Configuration
- [x] Create `SecurityConfig.java`
- [x] Create `JwtAuthenticationConverter.java`
- [x] Create `JwtValidatorConfig.java` (with @ConditionalOnProperty for test disable)
- [x] Create `SecurityErrorHandler.java`
- [x] Create `SecurityProperties.java` (additional - for @ConfigurationProperties)
- [x] Update `application.yml` with OAuth2 resource server config
- [x] Update `application-docker.yml` with Docker-specific config
- [x] Update `src/test/resources/application.yml` with test config (instead of application-test.yml)

### Phase 3: Method-Level Authorization
- [x] Update `ProductController.java` with `@PreAuthorize`
- [x] Add `@EnableReactiveMethodSecurity` to `SecurityConfig`

### Phase 4: Client Credentials
- [x] Create `OAuth2ClientConfig.java` (with @ConditionalOnProperty for test disable)
- [x] Update `application.yml` with client credentials config
- [x] Update `WebClientConfig.java` to add OAuth2 filter (with ObjectProvider for optional injection)

### Phase 5: WireMock Mocks
- [x] Create `oauth/jwks.json` mapping
- [x] Create `downstream-oauth/token.json` mapping
- [x] Create `downstream-oauth/token-chaos.json` mapping

### Phase 6: Test Support
- [x] Create `TestJwtBuilder.java`
- [x] Create `TestSecurityConfig.java`
- [x] Create `SecurityTestUtils.java`

### Phase 7: Unit Tests
- [x] Create `JwtAuthenticationConverterTest.java`
- [x] Create `ProductControllerSecurityTest.java`
- [x] Create `OAuth2ClientCacheTest.java`

### Phase 8: Integration Tests
- [ ] Create `OAuth2IntegrationTest.java` (NOT IMPLEMENTED - token caching tested via OAuth2ClientCacheTest)
- [x] Verify token caching behavior (tested in OAuth2ClientCacheTest)
- [ ] Verify downstream auth propagation (NOT IMPLEMENTED - requires Docker integration test)

### Phase 9: Chaos Tests
- [x] Create `oauth-chaos-test.js`
- [x] Create `oauth-circuit-breaker-test.js` (named `oauth-token-refresh-test.js`)
- [x] Update `docker-compose.yml` with OAuth chaos profiles

### Phase 10: Logging (DEFERRED)
- [ ] Add `SecurityErrorLogData.java` (NOT IMPLEMENTED - using existing ErrorLogData)
- [ ] Add `AuthenticatedRequestLogData.java` (NOT IMPLEMENTED)
- [ ] Add `TokenRefreshLogData.java` (NOT IMPLEMENTED)
- [ ] Update `StructuredLogger.java` with security methods (NOT IMPLEMENTED)

### Final Verification
- [x] Run `./gradlew test` - all 108 tests pass
- [x] Run `./gradlew build` - build succeeds
- [ ] Run chaos tests in Docker: `docker compose --profile oauth-chaos up k6-oauth-chaos` (NOT VERIFIED)
- [x] Verify health endpoints remain accessible without auth (tested in ProductControllerSecurityTest)
- [x] Verify Prometheus metrics endpoint accessible without auth (tested in ProductControllerSecurityTest)
- [x] Verify product endpoints require valid JWT (tested in ProductControllerSecurityTest)
- [ ] Verify downstream calls include Bearer token (NOT VERIFIED - OAuth2 client disabled in tests)
- [ ] Verify token caching (NOT VERIFIED - OAuth2 client disabled in tests)

## Implementation Notes

### Deviations from Plan
1. **SecurityProperties.java added** - Required for @ConfigurationProperties binding of security settings
2. **@ConditionalOnProperty used** - JwtValidatorConfig and OAuth2ClientConfig are disabled in tests to avoid bean conflicts
3. **WebClientConfig uses ObjectProvider** - Allows optional injection of OAuth2 filter when disabled in tests
4. **Test OAuth2 client disabled** - OAuth2 client credentials are disabled in tests (`app.security.oauth2-client.enabled: false`)
5. **Phase 10 (Logging) deferred** - Security-specific logging not implemented; existing logging sufficient

### Known Limitations
1. **OAuth2 client not tested end-to-end** - Disabled in tests to avoid WireMock complexity
2. **Token caching not verified** - Would require Docker integration test with WireMock
3. **Chaos tests not run** - Require full Docker stack with WireMock OAuth endpoints

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing tests | Gradually add security; use `@Import(TestSecurityConfig.class)` |
| Performance impact of JWT validation | JWT validation is local (no network call); use JWK Set caching |
| Token refresh race conditions | Spring's `InMemoryReactiveOAuth2AuthorizedClientService` handles this |
| Clock skew causing false token expiration | Configure `clock-skew-seconds` tolerance (default 30s) |
| Downstream service auth failures | Apply Resilience4j patterns to OAuth token acquisition |

---

## Rollback Plan

If issues arise after implementation:

1. **Quick Rollback**: Set `spring.security.oauth2.resourceserver.jwt.issuer-uri` to empty string and add `@Bean SecurityWebFilterChain` that permits all
2. **Disable Client Credentials**: Remove `oauth2Filter` from WebClient builders
3. **Full Rollback**: Revert to previous commit, remove Spring Security dependencies

---

## References

- [Spring Security OAuth 2.0 Resource Server](https://docs.spring.io/spring-security/reference/reactive/oauth2/resource-server/index.html)
- [Spring Security OAuth 2.0 Client](https://docs.spring.io/spring-security/reference/reactive/oauth2/client/index.html)
- [JWT Validation](https://docs.spring.io/spring-security/reference/reactive/oauth2/resource-server/jwt.html)
- [WebClient with OAuth2](https://docs.spring.io/spring-security/reference/reactive/oauth2/client/authorized-clients.html#oauth2Client-webclient-webflux)
- [Spring Security Testing](https://docs.spring.io/spring-security/reference/reactive/test/index.html)
