package org.example.customer.security;

import org.example.platform.security.JwtAuthenticationConverter;
import org.example.platform.security.SecurityErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Security configuration for customer-service. Configures JWT validation and authorization rules.
 */
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

  private final JwtAuthenticationConverter jwtAuthenticationConverter;
  private final SecurityErrorHandler securityErrorHandler;

  public SecurityConfig(
      JwtAuthenticationConverter jwtAuthenticationConverter,
      SecurityErrorHandler securityErrorHandler) {
    this.jwtAuthenticationConverter = jwtAuthenticationConverter;
    this.securityErrorHandler = securityErrorHandler;
  }

  @Bean
  public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
    return http.authorizeExchange(
            exchanges ->
                exchanges
                    // Actuator endpoints - permit all (exposure config controls what's available)
                    // In prod mode, only safe endpoints are exposed via application-prod.yml
                    .pathMatchers("/actuator/**")
                    .permitAll()
                    // All API endpoints require authentication
                    .anyExchange()
                    .authenticated())
        .oauth2ResourceServer(
            oauth2 ->
                oauth2
                    .jwt(
                        jwt ->
                            jwt.jwtAuthenticationConverter(
                                new ReactiveJwtAuthenticationConverterAdapter(
                                    jwtAuthenticationConverter)))
                    .authenticationEntryPoint(securityErrorHandler)
                    .accessDeniedHandler(securityErrorHandler))
        // Disable CSRF for stateless API
        .csrf(ServerHttpSecurity.CsrfSpec::disable)
        .build();
  }
}
