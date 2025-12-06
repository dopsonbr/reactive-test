package org.example.platform.test;

import io.jsonwebtoken.Jwts;
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
 * Utility class for generating test JWT tokens. Use this to create fake tokens for unit and
 * integration tests.
 *
 * <p>Example usage:
 *
 * <pre>
 * String token = TestJwtBuilder.builder()
 *     .scope("product:read")
 *     .subject("test-user")
 *     .build();
 * </pre>
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
        .issuer(issuer)
        .subject(subject)
        .audience()
        .add(audience)
        .and()
        .issuedAt(Date.from(issuedAt))
        .expiration(Date.from(expiration))
        .id(UUID.randomUUID().toString())
        .claim("scope", scope)
        .claims(additionalClaims)
        .signWith(KEY_PAIR.getPrivate())
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
