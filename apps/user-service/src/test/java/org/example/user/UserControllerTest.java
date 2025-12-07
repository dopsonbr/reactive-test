package org.example.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import org.example.user.controller.UserController;
import org.example.user.controller.dto.CreateUserRequest;
import org.example.user.controller.dto.UpdateUserRequest;
import org.example.user.model.Permission;
import org.example.user.model.User;
import org.example.user.model.UserPreferences;
import org.example.user.model.UserType;
import org.example.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

  @Mock private UserService userService;

  private UserController controller;

  @BeforeEach
  void setUp() {
    controller = new UserController(userService);
  }

  @Nested
  class GetUser {

    @Test
    void existingUser_returnsUser() {
      UUID userId = UUID.randomUUID();
      User user = createTestUser(userId, UserType.CUSTOMER);

      when(userService.findById(userId)).thenReturn(Mono.just(user));

      StepVerifier.create(controller.getUser(userId))
          .assertNext(
              response -> {
                assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
                assertThat(response.getBody()).isNotNull();
                assertThat(response.getBody().id()).isEqualTo(userId);
                assertThat(response.getBody().username()).isEqualTo(user.username());
              })
          .verifyComplete();
    }

    @Test
    void unknownUser_returns404() {
      UUID unknownId = UUID.randomUUID();

      when(userService.findById(unknownId)).thenReturn(Mono.empty());

      StepVerifier.create(controller.getUser(unknownId))
          .assertNext(
              response -> {
                assertThat(response.getStatusCode().value()).isEqualTo(404);
              })
          .verifyComplete();
    }
  }

  @Nested
  class CreateUser {

    @Test
    void validRequest_createsUser() {
      UUID userId = UUID.randomUUID();
      CreateUserRequest request =
          new CreateUserRequest(
              "newuser", "password123", UserType.CUSTOMER, null, "email@test.com", "New User");

      User createdUser = createTestUser(userId, UserType.CUSTOMER);
      when(userService.createUser(any(CreateUserRequest.class))).thenReturn(Mono.just(createdUser));

      StepVerifier.create(controller.createUser(request))
          .assertNext(
              response -> {
                assertThat(response.getStatusCode().value()).isEqualTo(201);
                assertThat(response.getBody()).isNotNull();
                assertThat(response.getBody().userType()).isEqualTo(UserType.CUSTOMER);
              })
          .verifyComplete();
    }
  }

  @Nested
  class UpdateUser {

    @Test
    void existingUser_updatesUser() {
      UUID userId = UUID.randomUUID();
      UpdateUserRequest request =
          new UpdateUserRequest("newemail@test.com", "Updated Name", null, null);

      User updatedUser =
          new User(
              userId,
              "testuser",
              UserType.CUSTOMER,
              Set.of(Permission.READ, Permission.WRITE),
              null,
              "newemail@test.com",
              "Updated Name",
              true,
              Instant.now(),
              Instant.now(),
              null);

      when(userService.updateUser(userId, request)).thenReturn(Mono.just(updatedUser));

      StepVerifier.create(controller.updateUser(userId, request))
          .assertNext(
              response -> {
                assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
                assertThat(response.getBody()).isNotNull();
                assertThat(response.getBody().email()).isEqualTo("newemail@test.com");
              })
          .verifyComplete();
    }

    @Test
    void unknownUser_returns404() {
      UUID unknownId = UUID.randomUUID();
      UpdateUserRequest request = new UpdateUserRequest("email@test.com", null, null, null);

      when(userService.updateUser(unknownId, request)).thenReturn(Mono.empty());

      StepVerifier.create(controller.updateUser(unknownId, request))
          .assertNext(
              response -> {
                assertThat(response.getStatusCode().value()).isEqualTo(404);
              })
          .verifyComplete();
    }
  }

  @Nested
  class GetPreferences {

    @Test
    void existingUser_returnsPreferences() {
      UUID userId = UUID.randomUUID();
      UserPreferences prefs =
          new UserPreferences(
              userId, "en-US", "America/New_York", "USD", false, false, true, false, "system", 20);

      when(userService.getPreferences(userId)).thenReturn(Mono.just(prefs));

      StepVerifier.create(controller.getPreferences(userId))
          .assertNext(
              response -> {
                assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
                assertThat(response.getBody()).isNotNull();
                assertThat(response.getBody().locale()).isEqualTo("en-US");
              })
          .verifyComplete();
    }

    @Test
    void unknownUser_returns404() {
      UUID unknownId = UUID.randomUUID();

      when(userService.getPreferences(unknownId)).thenReturn(Mono.empty());

      StepVerifier.create(controller.getPreferences(unknownId))
          .assertNext(
              response -> {
                assertThat(response.getStatusCode().value()).isEqualTo(404);
              })
          .verifyComplete();
    }
  }

  private User createTestUser(UUID id, UserType userType) {
    return new User(
        id,
        "testuser",
        userType,
        userType.getDefaultPermissions(),
        userType == UserType.EMPLOYEE ? 1234 : null,
        "test@example.com",
        "Test User",
        true,
        Instant.now(),
        Instant.now(),
        null);
  }
}
