package org.example.user.controller;

import java.util.Map;
import org.example.user.service.JwtService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/**
 * OIDC Discovery endpoints for token verification.
 *
 * <p>Provides /.well-known/openid-configuration and /.well-known/jwks.json endpoints that consuming
 * services use to verify JWT tokens.
 */
@RestController
@RequestMapping("/.well-known")
public class WellKnownController {

  private final JwtService jwtService;

  public WellKnownController(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  /** OpenID Connect Discovery endpoint. */
  @GetMapping("/openid-configuration")
  public Mono<Map<String, Object>> openidConfiguration() {
    String issuer = jwtService.getIssuer();

    return Mono.just(
        Map.of(
            "issuer", issuer,
            "authorization_endpoint", issuer + "/oauth2/authorize",
            "token_endpoint", issuer + "/oauth2/token",
            "jwks_uri", issuer + "/.well-known/jwks.json",
            "response_types_supported", new String[] {"code", "token"},
            "grant_types_supported",
                new String[] {
                  "authorization_code", "client_credentials", "refresh_token", "password"
                },
            "subject_types_supported", new String[] {"public"},
            "id_token_signing_alg_values_supported", new String[] {"RS256"},
            "token_endpoint_auth_methods_supported",
                new String[] {"client_secret_basic", "client_secret_post"}));
  }

  /** JWK Set endpoint for token verification. */
  @GetMapping("/jwks.json")
  public Mono<Map<String, Object>> jwks() {
    return Mono.just(jwtService.getJwkSet().toJSONObject());
  }
}
