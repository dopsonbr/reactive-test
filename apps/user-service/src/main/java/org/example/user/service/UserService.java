package org.example.user.service;

import java.time.Instant;
import java.util.UUID;
import org.example.user.controller.dto.CreateUserRequest;
import org.example.user.controller.dto.UpdatePreferencesRequest;
import org.example.user.controller.dto.UpdateUserRequest;
import org.example.user.model.User;
import org.example.user.model.UserPreferences;
import org.example.user.repository.UserPreferencesRepository;
import org.example.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/** Service for user management operations. */
@Service
public class UserService {

  private final UserRepository userRepository;
  private final UserPreferencesRepository preferencesRepository;
  private final PasswordEncoder passwordEncoder;

  public UserService(
      UserRepository userRepository,
      UserPreferencesRepository preferencesRepository,
      PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.preferencesRepository = preferencesRepository;
    this.passwordEncoder = passwordEncoder;
  }

  public Mono<User> findById(UUID id) {
    return userRepository.findById(id);
  }

  public Mono<User> findByUsername(String username) {
    return userRepository.findByUsername(username);
  }

  public Mono<User> createUser(CreateUserRequest request) {
    User user =
        new User(
            UUID.randomUUID(),
            request.username(),
            request.userType(),
            request.userType().getDefaultPermissions(),
            request.storeNumber(),
            request.email(),
            request.displayName(),
            true,
            Instant.now(),
            Instant.now(),
            null);

    String passwordHash = passwordEncoder.encode(request.password());

    return userRepository
        .save(user, passwordHash)
        .flatMap(
            savedUser -> {
              // Create default preferences
              UserPreferences prefs =
                  new UserPreferences(
                      savedUser.id(),
                      "en-US",
                      "America/New_York",
                      "USD",
                      false,
                      false,
                      true,
                      false,
                      "system",
                      20);
              return preferencesRepository.save(prefs).thenReturn(savedUser);
            });
  }

  public Mono<User> updateUser(UUID id, UpdateUserRequest request) {
    return userRepository
        .findById(id)
        .flatMap(
            existingUser -> {
              User updatedUser =
                  new User(
                      existingUser.id(),
                      existingUser.username(),
                      existingUser.userType(),
                      existingUser.permissions(),
                      request.storeNumber() != null
                          ? request.storeNumber()
                          : existingUser.storeNumber(),
                      request.email() != null ? request.email() : existingUser.email(),
                      request.displayName() != null
                          ? request.displayName()
                          : existingUser.displayName(),
                      request.active() != null ? request.active() : existingUser.active(),
                      existingUser.createdAt(),
                      Instant.now(),
                      existingUser.lastLoginAt());

              // We need to get the password hash - fetch it from the DB
              return userRepository
                  .getPasswordHash(existingUser.username())
                  .flatMap(hash -> userRepository.save(updatedUser, hash));
            });
  }

  public Mono<UserPreferences> getPreferences(UUID userId) {
    return preferencesRepository.findByUserId(userId);
  }

  public Mono<UserPreferences> updatePreferences(UUID userId, UpdatePreferencesRequest request) {
    return preferencesRepository
        .findByUserId(userId)
        .flatMap(
            existing -> {
              UserPreferences updated =
                  new UserPreferences(
                      existing.userId(),
                      request.locale() != null ? request.locale() : existing.locale(),
                      request.timezone() != null ? request.timezone() : existing.timezone(),
                      request.currency() != null ? request.currency() : existing.currency(),
                      request.marketingEmail() != null
                          ? request.marketingEmail()
                          : existing.marketingEmail(),
                      request.marketingSms() != null
                          ? request.marketingSms()
                          : existing.marketingSms(),
                      request.orderUpdatesEmail() != null
                          ? request.orderUpdatesEmail()
                          : existing.orderUpdatesEmail(),
                      request.orderUpdatesSms() != null
                          ? request.orderUpdatesSms()
                          : existing.orderUpdatesSms(),
                      request.displayTheme() != null
                          ? request.displayTheme()
                          : existing.displayTheme(),
                      request.itemsPerPage() != null
                          ? request.itemsPerPage()
                          : existing.itemsPerPage());
              return preferencesRepository.save(updated);
            });
  }
}
