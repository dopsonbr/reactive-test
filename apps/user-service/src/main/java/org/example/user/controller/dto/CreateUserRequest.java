package org.example.user.controller.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.example.user.model.UserType;

/** Request for creating a new user. */
public record CreateUserRequest(
    @NotBlank(message = "Username is required")
        @Size(min = 3, max = 100, message = "Username must be between 3 and 100 characters")
        String username,
    @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password,
    @NotNull(message = "User type is required") UserType userType,
    Integer storeNumber,
    @Email(message = "Email must be valid") String email,
    @Size(max = 200, message = "Display name must be at most 200 characters") String displayName) {}
