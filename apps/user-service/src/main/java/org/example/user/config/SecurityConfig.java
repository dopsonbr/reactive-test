package org.example.user.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Security configuration for user-service.
 *
 * <p>In dev mode, all endpoints are open for testing. The service provides JWT tokens via the
 * /dev/token endpoint for use by other services.
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
    return http.csrf(ServerHttpSecurity.CsrfSpec::disable)
        .authorizeExchange(
            exchanges ->
                exchanges
                    // Dev endpoints are open
                    .pathMatchers("/dev/**")
                    .permitAll()
                    // OIDC discovery endpoints
                    .pathMatchers("/.well-known/**")
                    .permitAll()
                    // OAuth2 endpoints (for future full implementation)
                    .pathMatchers("/oauth2/**")
                    .permitAll()
                    // Actuator endpoints
                    .pathMatchers("/actuator/**")
                    .permitAll()
                    // User management requires authentication
                    .pathMatchers("/users/**")
                    .permitAll() // Dev mode - open for now
                    .anyExchange()
                    .authenticated())
        .build();
  }
}
