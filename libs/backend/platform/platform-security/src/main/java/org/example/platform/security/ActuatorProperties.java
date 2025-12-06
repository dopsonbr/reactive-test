package org.example.platform.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for actuator endpoints. Bound to the 'app.actuator' prefix in
 * application.yml.
 *
 * <p>Default values are optimized for development (all endpoints exposed, no auth required). In
 * production, activate the 'prod' profile to restrict endpoints and require authentication.
 */
@Component
@ConfigurationProperties(prefix = "app.actuator")
public class ActuatorProperties {

  /** Whether to expose all actuator endpoints. Default: true (dev mode). */
  private boolean exposeAll = true;

  /** Whether to require authentication for actuator endpoints. Default: false (dev mode). */
  private boolean requireAuth = false;

  public boolean isExposeAll() {
    return exposeAll;
  }

  public void setExposeAll(boolean exposeAll) {
    this.exposeAll = exposeAll;
  }

  public boolean isRequireAuth() {
    return requireAuth;
  }

  public void setRequireAuth(boolean requireAuth) {
    this.requireAuth = requireAuth;
  }
}
