package org.example.user.controller;

import java.time.Instant;
import java.util.UUID;
import org.example.user.controller.dto.DevTokenRequest;
import org.example.user.controller.dto.DevTokenResponse;
import org.example.user.controller.dto.FakeUserRequest;
import org.example.user.model.User;
import org.example.user.model.UserType;
import org.example.user.repository.UserRepository;
import org.example.user.service.JwtService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Dev-only endpoints for generating tokens without OAuth flow.
 *
 * <p>These endpoints bypass authentication for rapid local development. NEVER AVAILABLE IN
 * PRODUCTION - only active with "dev" or "docker" profile.
 */
@Profile({"dev", "docker", "default"})
@RestController
@RequestMapping("/dev")
public class DevTokenController {

  private static final long TOKEN_EXPIRATION_HOURS = 24;

  private final JwtService jwtService;
  private final UserRepository userRepository;

  public DevTokenController(JwtService jwtService, UserRepository userRepository) {
    this.jwtService = jwtService;
    this.userRepository = userRepository;
  }

  /**
   * Generate a token for any user without password validation. If user doesn't exist, creates a
   * fake user on-the-fly.
   */
  @PostMapping("/token")
  public Mono<ResponseEntity<DevTokenResponse>> generateToken(
      @RequestBody DevTokenRequest request) {
    return userRepository
        .findByUsername(request.username())
        .switchIfEmpty(Mono.defer(() -> createFakeUser(request)))
        .map(
            user -> {
              String token = jwtService.generateToken(user, TOKEN_EXPIRATION_HOURS);

              return ResponseEntity.ok(
                  new DevTokenResponse(
                      token,
                      "Bearer",
                      TOKEN_EXPIRATION_HOURS * 3600,
                      user.userType(),
                      user.permissions()));
            });
  }

  /** Create a fake user for testing. */
  @PostMapping("/users/fake")
  public Mono<ResponseEntity<User>> createFakeUserEndpoint(@RequestBody FakeUserRequest request) {
    return createFakeUser(
            new DevTokenRequest(request.username(), request.userType(), request.storeNumber()))
        .map(ResponseEntity::ok);
  }

  /** List all users (dev only). */
  @GetMapping("/users")
  public Flux<User> listUsers() {
    return userRepository.findAll();
  }

  private Mono<User> createFakeUser(DevTokenRequest request) {
    UserType userType = request.userType() != null ? request.userType() : UserType.CUSTOMER;
    Integer storeNumber =
        userType == UserType.EMPLOYEE
            ? (request.storeNumber() != null ? request.storeNumber() : 1234)
            : null;

    User user =
        new User(
            UUID.randomUUID(),
            request.username(),
            userType,
            userType.getDefaultPermissions(),
            storeNumber,
            request.username() + "@dev.local",
            "Dev " + request.username(),
            true,
            Instant.now(),
            Instant.now(),
            null);

    return userRepository.save(user, "$2a$10$fake.hash.not.used.in.dev.mode");
  }
}
