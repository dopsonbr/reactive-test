package org.example.platform.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Permissive security configuration that allows all requests without authentication. Active when
 * app.security.enabled=false (e.g., for load testing or local development).
 */
@Configuration
@EnableWebFluxSecurity
@ConditionalOnProperty(name = "app.security.enabled", havingValue = "false")
public class NoopSecurityConfig {

  @Bean
  public SecurityWebFilterChain noopSecurityWebFilterChain(ServerHttpSecurity http) {
    return http.authorizeExchange(exchanges -> exchanges.anyExchange().permitAll())
        .csrf(ServerHttpSecurity.CsrfSpec::disable)
        .build();
  }
}
