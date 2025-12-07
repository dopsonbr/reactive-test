package org.example.user.service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKMatcher;
import com.nimbusds.jose.jwk.JWKSelector;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyType;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import org.example.user.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Service for generating and signing JWT tokens. */
@Service
public class JwtService {

  private final JWKSource<SecurityContext> jwkSource;
  private final String issuer;
  private final RSAKey rsaKey;

  public JwtService(JWKSource<SecurityContext> jwkSource, @Value("${jwt.issuer}") String issuer) {
    this.jwkSource = jwkSource;
    this.issuer = issuer;

    // Get the RSA key from the JWK source
    try {
      JWKSelector selector = new JWKSelector(new JWKMatcher.Builder().keyType(KeyType.RSA).build());
      List<JWK> keys = jwkSource.get(selector, null);
      this.rsaKey = keys.get(0).toRSAKey();
    } catch (Exception e) {
      throw new IllegalStateException("Failed to get RSA key from JWK source", e);
    }
  }

  /** Generate a JWT token for a user. */
  public String generateToken(User user, long expirationHours) {
    try {
      Instant now = Instant.now();
      Instant expiration = now.plus(expirationHours, ChronoUnit.HOURS);

      JWTClaimsSet.Builder claimsBuilder =
          new JWTClaimsSet.Builder()
              .issuer(issuer)
              .subject(user.id().toString())
              .claim("username", user.username())
              .claim("user_type", user.userType().name())
              .claim("permissions", user.permissions().stream().map(Enum::name).toList())
              .claim("scope", user.scopeString())
              .audience("reactive-platform")
              .issueTime(Date.from(now))
              .expirationTime(Date.from(expiration))
              .jwtID(UUID.randomUUID().toString());

      if (user.storeNumber() != null) {
        claimsBuilder.claim("store_number", user.storeNumber());
      }

      if (user.email() != null) {
        claimsBuilder.claim("email", user.email());
      }

      JWTClaimsSet claims = claimsBuilder.build();

      JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(rsaKey.getKeyID()).build();

      SignedJWT signedJWT = new SignedJWT(header, claims);

      JWSSigner signer = new RSASSASigner(rsaKey);
      signedJWT.sign(signer);

      return signedJWT.serialize();
    } catch (JOSEException e) {
      throw new RuntimeException("Failed to sign JWT", e);
    }
  }

  /** Get the JWK Set for token verification (exposed via /.well-known/jwks.json). */
  public JWKSet getJwkSet() {
    try {
      JWKSelector selector = new JWKSelector(new JWKMatcher.Builder().keyType(KeyType.RSA).build());
      List<JWK> keys = jwkSource.get(selector, null);
      return new JWKSet(keys);
    } catch (Exception e) {
      throw new IllegalStateException("Failed to get JWK set", e);
    }
  }

  public String getIssuer() {
    return issuer;
  }
}
