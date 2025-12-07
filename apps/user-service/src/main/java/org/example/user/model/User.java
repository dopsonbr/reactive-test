package org.example.user.model;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/** Domain model for a user. */
public record User(
    UUID id,
    String username,
    UserType userType,
    Set<Permission> permissions,
    Integer storeNumber,
    String email,
    String displayName,
    boolean active,
    Instant createdAt,
    Instant updatedAt,
    Instant lastLoginAt) {
  /** Check if user can search customers (employee with customer_search permission). */
  public boolean canSearchCustomers() {
    return userType == UserType.EMPLOYEE && permissions.contains(Permission.CUSTOMER_SEARCH);
  }

  /** Get permissions as a space-delimited scope string for JWT. */
  public String scopeString() {
    return permissions.stream()
        .map(p -> p.name().toLowerCase())
        .reduce((a, b) -> a + " " + b)
        .orElse("");
  }
}
