package org.example.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.util.UUID;
import org.example.user.controller.WellKnownController;
import org.example.user.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class WellKnownControllerTest {

  @Mock private JwtService jwtService;

  private WellKnownController controller;

  @BeforeEach
  void setUp() {
    controller = new WellKnownController(jwtService);
  }

  @Test
  void shouldReturnOpenIdConfiguration() {
    when(jwtService.getIssuer()).thenReturn("http://localhost:8089");

    StepVerifier.create(controller.openidConfiguration())
        .assertNext(
            config -> {
              assertThat(config.get("issuer")).isEqualTo("http://localhost:8089");
              assertThat(config.get("jwks_uri"))
                  .isEqualTo("http://localhost:8089/.well-known/jwks.json");
              assertThat(config.get("token_endpoint"))
                  .isEqualTo("http://localhost:8089/oauth2/token");
            })
        .verifyComplete();
  }

  @Test
  @SuppressWarnings("unchecked")
  void shouldReturnJwkSet() throws Exception {
    // Generate a test RSA key
    KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
    keyGen.initialize(2048);
    KeyPair keyPair = keyGen.generateKeyPair();
    RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();

    RSAKey rsaKey = new RSAKey.Builder(publicKey).keyID(UUID.randomUUID().toString()).build();
    JWKSet jwkSet = new JWKSet(rsaKey);

    when(jwtService.getJwkSet()).thenReturn(jwkSet);

    StepVerifier.create(controller.jwks())
        .assertNext(
            result -> {
              assertThat(result.get("keys")).isNotNull();
              assertThat(result.get("keys")).isInstanceOf(java.util.List.class);
            })
        .verifyComplete();
  }
}
