package org.example.user.controller.dto;

import org.example.user.model.UserType;

/** Request for generating a dev token. */
public record DevTokenRequest(String username, UserType userType, Integer storeNumber) {}
