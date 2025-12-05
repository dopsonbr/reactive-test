package org.example.platform.test;

import java.security.interfaces.RSAPublicKey;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

/**
 * Test configuration that uses the test key pair for JWT validation. Apply to integration tests
 * that need to validate tokens.
 *
 * <p>Usage:
 *
 * <pre>
 * {@literal @}SpringBootTest
 * {@literal @}Import(TestSecurityConfig.class)
 * class MyTest {
 *     // ...
 * }
 * </pre>
 */
@TestConfiguration
public class TestSecurityConfig {

  @Bean
  @Primary
  public ReactiveJwtDecoder testJwtDecoder() {
    return NimbusReactiveJwtDecoder.withPublicKey((RSAPublicKey) TestJwtBuilder.getPublicKey())
        .build();
  }
}
