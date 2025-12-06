package org.example.platform.security;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for OAuth2 security. Bound to the 'app.security' prefix in
 * application.yml.
 */
@Component
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {

  /** Whether security is enabled. Set to false in tests to skip JWT validation config. */
  private boolean enabled = true;

  /** JWK Set URI for JWT signature verification. */
  private String jwkSetUri;

  /** List of allowed token issuers. */
  private List<String> allowedIssuers = new ArrayList<>();

  /** Required audience claim value. */
  private String requiredAudience = "reactive-test-api";

  /** Clock skew tolerance in seconds for token expiration validation. */
  private long clockSkewSeconds = 30;

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getJwkSetUri() {
    return jwkSetUri;
  }

  public void setJwkSetUri(String jwkSetUri) {
    this.jwkSetUri = jwkSetUri;
  }

  public List<String> getAllowedIssuers() {
    return allowedIssuers;
  }

  public void setAllowedIssuers(List<String> allowedIssuers) {
    this.allowedIssuers = allowedIssuers;
  }

  public String getRequiredAudience() {
    return requiredAudience;
  }

  public void setRequiredAudience(String requiredAudience) {
    this.requiredAudience = requiredAudience;
  }

  public long getClockSkewSeconds() {
    return clockSkewSeconds;
  }

  public void setClockSkewSeconds(long clockSkewSeconds) {
    this.clockSkewSeconds = clockSkewSeconds;
  }
}
