package org.example.user.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import org.example.user.controller.dto.CreateUserRequest;
import org.example.user.controller.dto.UpdatePreferencesRequest;
import org.example.user.controller.dto.UpdateUserRequest;
import org.example.user.controller.dto.UserPreferencesResponse;
import org.example.user.controller.dto.UserResponse;
import org.example.user.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/** Controller for user management operations. */
@RestController
@RequestMapping("/users")
public class UserController {

  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @GetMapping("/{id}")
  public Mono<ResponseEntity<UserResponse>> getUser(@PathVariable UUID id) {
    return userService
        .findById(id)
        .map(UserResponse::from)
        .map(ResponseEntity::ok)
        .defaultIfEmpty(ResponseEntity.notFound().build());
  }

  @PostMapping
  public Mono<ResponseEntity<UserResponse>> createUser(
      @RequestBody @Valid CreateUserRequest request) {
    return userService
        .createUser(request)
        .map(UserResponse::from)
        .map(user -> ResponseEntity.status(HttpStatus.CREATED).body(user));
  }

  @PutMapping("/{id}")
  public Mono<ResponseEntity<UserResponse>> updateUser(
      @PathVariable UUID id, @RequestBody @Valid UpdateUserRequest request) {
    return userService
        .updateUser(id, request)
        .map(UserResponse::from)
        .map(ResponseEntity::ok)
        .defaultIfEmpty(ResponseEntity.notFound().build());
  }

  @GetMapping("/{id}/preferences")
  public Mono<ResponseEntity<UserPreferencesResponse>> getPreferences(@PathVariable UUID id) {
    return userService
        .getPreferences(id)
        .map(UserPreferencesResponse::from)
        .map(ResponseEntity::ok)
        .defaultIfEmpty(ResponseEntity.notFound().build());
  }

  @PutMapping("/{id}/preferences")
  public Mono<ResponseEntity<UserPreferencesResponse>> updatePreferences(
      @PathVariable UUID id, @RequestBody @Valid UpdatePreferencesRequest request) {
    return userService
        .updatePreferences(id, request)
        .map(UserPreferencesResponse::from)
        .map(ResponseEntity::ok)
        .defaultIfEmpty(ResponseEntity.notFound().build());
  }
}
