package org.example.user.controller.dto;

import org.example.user.model.UserType;

/** Request for creating a fake user for testing. */
public record FakeUserRequest(String username, UserType userType, Integer storeNumber) {}
