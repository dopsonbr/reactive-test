package org.example.checkout.config;

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
 * Security configuration for checkout-service. Configures OAuth2 resource server with JWT
 * validation. Disabled when app.security.enabled=false (e.g., for load testing or local
 * development).
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
                    // Checkout operations require checkout:write scope
                    .pathMatchers(HttpMethod.POST, "/checkout/**")
                    .hasAuthority("SCOPE_checkout:write")
                    // Order read operations require checkout:read scope
                    .pathMatchers(HttpMethod.GET, "/orders/**")
                    .hasAuthority("SCOPE_checkout:read")
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
