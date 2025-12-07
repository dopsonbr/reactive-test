package org.example.user.model;

import java.util.Set;

/** Types of users in the system with their default permissions. */
public enum UserType {
  SERVICE_ACCOUNT(Set.of(Permission.READ)),
  CUSTOMER(Set.of(Permission.READ, Permission.WRITE)),
  EMPLOYEE(Set.of(Permission.READ, Permission.WRITE, Permission.ADMIN, Permission.CUSTOMER_SEARCH));

  private final Set<Permission> defaultPermissions;

  UserType(Set<Permission> defaultPermissions) {
    this.defaultPermissions = defaultPermissions;
  }

  public Set<Permission> getDefaultPermissions() {
    return defaultPermissions;
  }
}
