package org.example.user.controller.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Set;
import org.example.user.model.Permission;
import org.example.user.model.UserType;

/** Response containing the generated dev token. */
public record DevTokenResponse(
    @JsonProperty("access_token") String accessToken,
    @JsonProperty("token_type") String tokenType,
    @JsonProperty("expires_in") long expiresIn,
    @JsonProperty("user_type") UserType userType,
    Set<Permission> permissions) {}
