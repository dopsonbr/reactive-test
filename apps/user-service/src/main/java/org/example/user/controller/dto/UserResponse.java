package org.example.user.controller.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import org.example.user.model.Permission;
import org.example.user.model.User;
import org.example.user.model.UserType;

/** Response DTO for user data. */
public record UserResponse(
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

  public static UserResponse from(User user) {
    return new UserResponse(
        user.id(),
        user.username(),
        user.userType(),
        user.permissions(),
        user.storeNumber(),
        user.email(),
        user.displayName(),
        user.active(),
        user.createdAt(),
        user.updatedAt(),
        user.lastLoginAt());
  }
}
