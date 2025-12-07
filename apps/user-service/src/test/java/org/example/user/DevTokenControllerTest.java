package org.example.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import org.example.user.controller.DevTokenController;
import org.example.user.controller.dto.DevTokenRequest;
import org.example.user.model.Permission;
import org.example.user.model.User;
import org.example.user.model.UserType;
import org.example.user.repository.UserRepository;
import org.example.user.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class DevTokenControllerTest {

  @Mock private JwtService jwtService;
  @Mock private UserRepository userRepository;

  private DevTokenController controller;

  @BeforeEach
  void setUp() {
    controller = new DevTokenController(jwtService, userRepository);
  }

  @Test
  void shouldGenerateTokenForExistingUser() {
    User existingUser =
        new User(
            UUID.randomUUID(),
            "dev-employee",
            UserType.EMPLOYEE,
            Set.of(Permission.READ, Permission.WRITE, Permission.ADMIN, Permission.CUSTOMER_SEARCH),
            1234,
            "employee@dev.local",
            "Dev Employee",
            true,
            Instant.now(),
            Instant.now(),
            null);

    when(userRepository.findByUsername("dev-employee")).thenReturn(Mono.just(existingUser));
    when(jwtService.generateToken(any(User.class), anyLong())).thenReturn("mock-jwt-token");

    DevTokenRequest request = new DevTokenRequest("dev-employee", null, null);

    StepVerifier.create(controller.generateToken(request))
        .assertNext(
            response -> {
              assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
              assertThat(response.getBody()).isNotNull();
              assertThat(response.getBody().accessToken()).isEqualTo("mock-jwt-token");
              assertThat(response.getBody().userType()).isEqualTo(UserType.EMPLOYEE);
            })
        .verifyComplete();
  }

  @Test
  void shouldCreateFakeUserWhenNotFound() {
    User newUser =
        new User(
            UUID.randomUUID(),
            "new-user",
            UserType.CUSTOMER,
            Set.of(Permission.READ, Permission.WRITE),
            null,
            "new-user@dev.local",
            "Dev new-user",
            true,
            Instant.now(),
            Instant.now(),
            null);

    when(userRepository.findByUsername("new-user")).thenReturn(Mono.empty());
    when(userRepository.save(any(User.class), anyString())).thenReturn(Mono.just(newUser));
    when(jwtService.generateToken(any(User.class), anyLong())).thenReturn("mock-jwt-token");

    DevTokenRequest request = new DevTokenRequest("new-user", UserType.CUSTOMER, null);

    StepVerifier.create(controller.generateToken(request))
        .assertNext(
            response -> {
              assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
              assertThat(response.getBody()).isNotNull();
              assertThat(response.getBody().userType()).isEqualTo(UserType.CUSTOMER);
            })
        .verifyComplete();
  }

  @Test
  void shouldAssignStoreNumberForEmployee() {
    User newEmployee =
        new User(
            UUID.randomUUID(),
            "new-employee",
            UserType.EMPLOYEE,
            UserType.EMPLOYEE.getDefaultPermissions(),
            5678,
            "new-employee@dev.local",
            "Dev new-employee",
            true,
            Instant.now(),
            Instant.now(),
            null);

    when(userRepository.findByUsername("new-employee")).thenReturn(Mono.empty());
    when(userRepository.save(any(User.class), anyString())).thenReturn(Mono.just(newEmployee));
    when(jwtService.generateToken(any(User.class), anyLong())).thenReturn("mock-jwt-token");

    DevTokenRequest request = new DevTokenRequest("new-employee", UserType.EMPLOYEE, 5678);

    StepVerifier.create(controller.generateToken(request))
        .assertNext(
            response -> {
              assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
            })
        .verifyComplete();
  }
}
