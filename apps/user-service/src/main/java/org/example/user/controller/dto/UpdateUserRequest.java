package org.example.user.controller.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/** Request for updating an existing user. */
public record UpdateUserRequest(
    @Email(message = "Email must be valid") String email,
    @Size(max = 200, message = "Display name must be at most 200 characters") String displayName,
    Integer storeNumber,
    Boolean active) {}
