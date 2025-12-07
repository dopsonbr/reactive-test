package org.example.cart.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Security configuration for cart-service. Configures OAuth2 resource server with JWT validation.
 * Disabled when app.security.enabled=false (e.g., for load testing or local development).
 */
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
@ConditionalOnProperty(name = "app.security.enabled", havingValue = "true", matchIfMissing = true)
public class SecurityConfig {

  @Bean
  public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
    return http.csrf(ServerHttpSecurity.CsrfSpec::disable)
        .authorizeExchange(
            exchanges ->
                exchanges
                    // Read operations require cart:read scope
                    .pathMatchers(HttpMethod.GET, "/carts/**")
                    .hasAuthority("SCOPE_cart:read")
                    // Write operations require cart:write scope
                    .pathMatchers(HttpMethod.POST, "/carts/**")
                    .hasAuthority("SCOPE_cart:write")
                    .pathMatchers(HttpMethod.PUT, "/carts/**")
                    .hasAuthority("SCOPE_cart:write")
                    .pathMatchers(HttpMethod.DELETE, "/carts/**")
                    .hasAuthority("SCOPE_cart:write")
                    // GraphQL endpoint requires authentication
                    // (method-level security handles scope checks)
                    .pathMatchers("/graphql")
                    .authenticated()
                    // GraphiQL explorer (disable in production)
                    .pathMatchers("/graphiql")
                    .permitAll()
                    // Actuator endpoints are public
                    .pathMatchers("/actuator/**")
                    .permitAll()
                    // All other requests require authentication
                    .anyExchange()
                    .authenticated())
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
        .build();
  }
}
