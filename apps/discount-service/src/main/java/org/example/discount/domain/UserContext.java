package org.example.discount.domain;

import java.util.Set;

/**
 * Context about the current user from user-service.
 *
 * @param userId the user ID
 * @param displayName the user's display name
 * @param userType the type of user (EMPLOYEE, CUSTOMER, SERVICE_ACCOUNT)
 * @param role the user's role (ASSOCIATE, SUPERVISOR, MANAGER, ADMIN)
 * @param permissions the user's permissions
 * @param storeNumber the store number (for employees)
 * @param pinHash hashed PIN for authentication (employees only)
 */
public record UserContext(
    String userId,
    String displayName,
    UserType userType,
    String role,
    Set<Permission> permissions,
    Integer storeNumber,
    String pinHash) {

  public static UserContext anonymous() {
    return new UserContext(
        null, "Anonymous", UserType.CUSTOMER, "GUEST", Set.of(Permission.READ), null, null);
  }

  public boolean isEmployee() {
    return userType == UserType.EMPLOYEE;
  }

  public boolean canApplyMarkdown() {
    return isEmployee() && permissions.contains(Permission.ADMIN);
  }

  /**
   * Validate the provided PIN against the stored hash. In a real implementation, this would use
   * proper password hashing.
   *
   * @param pin the PIN to validate
   * @return true if the PIN matches
   */
  public boolean validatePin(String pin) {
    // Simple validation - in production, use proper password hashing
    return pinHash != null && pinHash.equals(pin);
  }

  public enum UserType {
    SERVICE_ACCOUNT,
    CUSTOMER,
    EMPLOYEE
  }

  public enum Permission {
    READ,
    WRITE,
    ADMIN,
    CUSTOMER_SEARCH
  }
}
