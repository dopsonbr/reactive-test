# 042_USER_SERVICE_STANDARDS_REMEDIATION

**Status: ACTIVE**

---

## Overview

Remediate standards compliance issues in user-service identified by the backend-standards-verifier. The service is functional but needs architectural cleanup before production deployment.

**Predecessor:** `docs/archive/036_USER_SERVICE.md` (Phase 1-9 complete)
**Compliance Score:** 62.5% → Target: 95%+

---

## Summary of Required Changes

| Priority | Issue | Impact |
|----------|-------|--------|
| Critical | `model/` → `domain/` rename | Package naming standard |
| Critical | Missing validation layer | Request validation standard |
| Critical | Controller→Repository violation | Architecture layers |
| Major | Business logic in domain models | Model purity standard |
| Major | No StructuredLogger | Observability standard |
| Minor | Missing service/repository tests | Test coverage |

---

## Phase 1: Package Rename (`model/` → `domain/`)

**Standard:** `docs/standards/backend/architecture.md` line 34

**Files:**
- RENAME: `apps/user-service/src/main/java/org/example/user/model/` → `domain/`
- UPDATE: All imports in 15+ files

**Steps:**

1. Rename directory:
```bash
git mv apps/user-service/src/main/java/org/example/user/model \
       apps/user-service/src/main/java/org/example/user/domain
```

2. Update imports in all affected files:
   - `config/JwtConfig.java`
   - `config/SecurityConfig.java`
   - `controller/DevTokenController.java`
   - `controller/UserController.java`
   - `controller/WellKnownController.java`
   - `controller/dto/*.java` (6 files)
   - `repository/*.java` (4 files)
   - `service/*.java` (2 files)
   - All test files (3 files)

3. Run tests to verify:
```bash
pnpm nx test :apps:user-service
```

---

## Phase 2: Implement Validation Layer

**Standard:** `docs/standards/backend/validation.md`

**Files:**
- CREATE: `apps/user-service/src/main/java/org/example/user/validation/UserRequestValidator.java`
- MODIFY: `apps/user-service/src/main/java/org/example/user/controller/UserController.java`

**Implementation:**

```java
// validation/UserRequestValidator.java
package org.example.user.validation;

import org.example.platform.error.ValidationException;
import org.example.user.controller.dto.CreateUserRequest;
import org.example.user.controller.dto.UpdateUserRequest;
import org.example.user.controller.dto.UpdatePreferencesRequest;
import org.example.user.domain.UserType;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class UserRequestValidator {

    private static final String HEADER_USER_ID = "x-userid";
    private static final String HEADER_SESSION_ID = "x-sessionid";

    public Mono<Void> validateGetUser(UUID id, HttpHeaders headers) {
        return Mono.defer(() -> {
            List<String> errors = new ArrayList<>();
            validateRequiredHeaders(headers, errors);

            if (id == null) {
                errors.add("User ID is required");
            }

            return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
        });
    }

    public Mono<Void> validateCreateUser(CreateUserRequest request, HttpHeaders headers) {
        return Mono.defer(() -> {
            List<String> errors = new ArrayList<>();
            validateRequiredHeaders(headers, errors);

            if (request.username() == null || request.username().isBlank()) {
                errors.add("username is required");
            } else if (request.username().length() > 100) {
                errors.add("username must not exceed 100 characters");
            }

            if (request.userType() == null) {
                errors.add("userType is required");
            }

            if (request.userType() == UserType.EMPLOYEE && request.storeNumber() == null) {
                errors.add("storeNumber is required for EMPLOYEE users");
            }

            if (request.email() != null && !request.email().contains("@")) {
                errors.add("email must be a valid email address");
            }

            return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
        });
    }

    public Mono<Void> validateUpdateUser(UUID id, UpdateUserRequest request, HttpHeaders headers) {
        return Mono.defer(() -> {
            List<String> errors = new ArrayList<>();
            validateRequiredHeaders(headers, errors);

            if (id == null) {
                errors.add("User ID is required");
            }

            if (request.email() != null && !request.email().contains("@")) {
                errors.add("email must be a valid email address");
            }

            return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
        });
    }

    public Mono<Void> validatePreferencesRequest(UUID id, HttpHeaders headers) {
        return Mono.defer(() -> {
            List<String> errors = new ArrayList<>();
            validateRequiredHeaders(headers, errors);

            if (id == null) {
                errors.add("User ID is required");
            }

            return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
        });
    }

    private void validateRequiredHeaders(HttpHeaders headers, List<String> errors) {
        if (headers.getFirst(HEADER_USER_ID) == null) {
            errors.add("x-userid header is required");
        }
        if (headers.getFirst(HEADER_SESSION_ID) == null) {
            errors.add("x-sessionid header is required");
        }
    }
}
```

**UserController updates:**

```java
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final UserRequestValidator validator;

    public UserController(UserService userService, UserRequestValidator validator) {
        this.userService = userService;
        this.validator = validator;
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<UserResponse>> getUser(
            @PathVariable UUID id,
            @RequestHeader HttpHeaders headers) {
        return validator.validateGetUser(id, headers)
            .then(userService.findById(id))
            .map(UserResponse::from)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Mono<ResponseEntity<UserResponse>> createUser(
            @RequestBody @Valid CreateUserRequest request,
            @RequestHeader HttpHeaders headers) {
        return validator.validateCreateUser(request, headers)
            .then(userService.createUser(request))
            .map(UserResponse::from)
            .map(user -> ResponseEntity.status(201).body(user));
    }

    // ... similar pattern for other endpoints
}
```

---

## Phase 3: Fix DevTokenController Layer Violation

**Standard:** `docs/standards/backend/architecture.md` line 80

**Problem:** Controller directly injects `UserRepository`

**Files:**
- MODIFY: `apps/user-service/src/main/java/org/example/user/service/UserService.java`
- MODIFY: `apps/user-service/src/main/java/org/example/user/controller/DevTokenController.java`

**UserService additions:**

```java
public interface UserService {
    // Existing methods...

    // New methods for DevTokenController
    Mono<User> findOrCreateDevUser(String username, UserType userType, Integer storeNumber);
    Flux<User> findAllUsers();
}
```

**UserService implementation:**

```java
@Override
public Mono<User> findOrCreateDevUser(String username, UserType userType, Integer storeNumber) {
    return userRepository.findByUsername(username)
        .switchIfEmpty(Mono.defer(() -> {
            UserType type = userType != null ? userType : UserType.CUSTOMER;
            Integer store = type == UserType.EMPLOYEE
                ? (storeNumber != null ? storeNumber : 1234)
                : null;

            User user = new User(
                UUID.randomUUID(),
                username,
                type,
                getDefaultPermissions(type),
                store,
                username + "@dev.local",
                "Dev " + username,
                true,
                Instant.now(),
                Instant.now(),
                null
            );

            return userRepository.save(user, "$2a$10$fake.hash.not.used.in.dev.mode");
        }));
}

@Override
public Flux<User> findAllUsers() {
    return userRepository.findAll();
}
```

**DevTokenController refactored:**

```java
@Profile({"dev", "docker", "default"})
@RestController
@RequestMapping("/dev")
public class DevTokenController {

    private final JwtService jwtService;
    private final UserService userService;  // Not UserRepository!

    public DevTokenController(JwtService jwtService, UserService userService) {
        this.jwtService = jwtService;
        this.userService = userService;
    }

    @PostMapping("/token")
    public Mono<ResponseEntity<DevTokenResponse>> generateToken(@RequestBody DevTokenRequest request) {
        return userService.findOrCreateDevUser(
                request.username(),
                request.userType(),
                request.storeNumber()
            )
            .map(user -> {
                String token = jwtService.generateToken(user);
                return ResponseEntity.ok(new DevTokenResponse(
                    token,
                    "Bearer",
                    86400,
                    user.userType(),
                    user.permissions()
                ));
            });
    }

    @GetMapping("/users")
    public Flux<User> listUsers() {
        return userService.findAllUsers();
    }

    @PostMapping("/users/fake")
    public Mono<ResponseEntity<User>> createFakeUser(@RequestBody FakeUserRequest request) {
        return userService.findOrCreateDevUser(
                request.username(),
                request.userType(),
                request.storeNumber()
            )
            .map(ResponseEntity::ok);
    }
}
```

---

## Phase 4: Move Business Logic from Domain Models

**Standard:** `docs/standards/backend/models.md` lines 32-42

**Problem:** Domain records contain business methods

**Files:**
- MODIFY: `apps/user-service/src/main/java/org/example/user/domain/User.java`
- MODIFY: `apps/user-service/src/main/java/org/example/user/domain/UserType.java`
- MODIFY: `apps/user-service/src/main/java/org/example/user/service/UserService.java`

**User.java (cleaned):**

```java
package org.example.user.domain;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record User(
    UUID id,
    String username,
    UserType userType,
    Set<Permission> permissions,
    Integer storeNumber,
    String email,
    String displayName,
    boolean active,
    Instant createdAt,
    Instant updatedAt,
    Instant lastLoginAt
) {
    // No business methods - pure data carrier
}
```

**UserType.java (cleaned):**

```java
package org.example.user.domain;

public enum UserType {
    SERVICE_ACCOUNT,
    CUSTOMER,
    EMPLOYEE
    // No getDefaultPermissions() - moved to service
}
```

**UserService additions:**

```java
public interface UserService {
    // ... existing methods

    // Business logic moved from domain models
    boolean canSearchCustomers(User user);
    String scopeString(User user);
    Set<Permission> getDefaultPermissions(UserType userType);
}
```

**Implementation:**

```java
@Override
public boolean canSearchCustomers(User user) {
    return user.userType() == UserType.EMPLOYEE
        && user.permissions().contains(Permission.CUSTOMER_SEARCH);
}

@Override
public String scopeString(User user) {
    return user.permissions().stream()
        .map(p -> p.name().toLowerCase())
        .reduce((a, b) -> a + " " + b)
        .orElse("");
}

@Override
public Set<Permission> getDefaultPermissions(UserType userType) {
    return switch (userType) {
        case SERVICE_ACCOUNT -> Set.of(Permission.READ);
        case CUSTOMER -> Set.of(Permission.READ, Permission.WRITE);
        case EMPLOYEE -> Set.of(Permission.READ, Permission.WRITE,
                                 Permission.ADMIN, Permission.CUSTOMER_SEARCH);
    };
}
```

**Update callers:**
- `JwtService.java` - use `userService.scopeString(user)` instead of `user.scopeString()`
- `DevTokenController.java` - use `userService.getDefaultPermissions(type)`

---

## Phase 5: Add StructuredLogger

**Standard:** `docs/standards/backend/observability-logs.md` lines 86-102

**Files:**
- MODIFY: `apps/user-service/src/main/java/org/example/user/service/UserService.java` (impl)
- MODIFY: `apps/user-service/src/main/java/org/example/user/service/JwtService.java`

**Implementation pattern:**

```java
@Service
public class UserServiceImpl implements UserService {

    private final StructuredLogger logger;
    private final UserRepository userRepository;
    private final UserPreferencesRepository preferencesRepository;

    public UserServiceImpl(
            StructuredLogger logger,
            UserRepository userRepository,
            UserPreferencesRepository preferencesRepository) {
        this.logger = logger;
        this.userRepository = userRepository;
        this.preferencesRepository = preferencesRepository;
    }

    @Override
    public Mono<User> findById(UUID id) {
        return Mono.deferContextual(ctx -> {
            logger.logMessage(ctx, "userservice", "Finding user by ID",
                Map.of("userId", id.toString()));

            return userRepository.findById(id)
                .doOnNext(user -> logger.logMessage(ctx, "userservice",
                    "User found", Map.of("userId", id.toString(), "username", user.username())))
                .doOnError(e -> logger.logError(ctx, "userservice",
                    "Error finding user", e, Map.of("userId", id.toString())));
        });
    }

    @Override
    public Mono<User> createUser(CreateUserRequest request) {
        return Mono.deferContextual(ctx -> {
            logger.logMessage(ctx, "userservice", "Creating user",
                Map.of("username", request.username(), "userType", request.userType().name()));

            Set<Permission> permissions = getDefaultPermissions(request.userType());
            User user = new User(
                UUID.randomUUID(),
                request.username(),
                request.userType(),
                permissions,
                request.storeNumber(),
                request.email(),
                request.displayName(),
                true,
                Instant.now(),
                Instant.now(),
                null
            );

            return userRepository.save(user, hashPassword(request.password()))
                .doOnNext(saved -> logger.logMessage(ctx, "userservice",
                    "User created", Map.of("userId", saved.id().toString())));
        });
    }

    // ... similar pattern for other methods
}
```

---

## Phase 6: Expand Test Coverage

**Current:** 3 controller tests only
**Target:** Service, repository, and validator tests

**Files to create:**

### 6.1 Validator Tests

```java
// src/test/java/org/example/user/validation/UserRequestValidatorTest.java
package org.example.user.validation;

import org.example.platform.error.ValidationException;
import org.example.user.controller.dto.CreateUserRequest;
import org.example.user.domain.UserType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import reactor.test.StepVerifier;

import java.util.UUID;

class UserRequestValidatorTest {

    private UserRequestValidator validator;

    @BeforeEach
    void setUp() {
        validator = new UserRequestValidator();
    }

    @Test
    void validateGetUser_withValidHeaders_succeeds() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("x-userid", "user123");
        headers.add("x-sessionid", "session456");

        StepVerifier.create(validator.validateGetUser(UUID.randomUUID(), headers))
            .verifyComplete();
    }

    @Test
    void validateGetUser_missingHeaders_fails() {
        HttpHeaders headers = new HttpHeaders();

        StepVerifier.create(validator.validateGetUser(UUID.randomUUID(), headers))
            .expectErrorMatches(e -> e instanceof ValidationException
                && e.getMessage().contains("x-userid"))
            .verify();
    }

    @Test
    void validateCreateUser_employeeWithoutStore_fails() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("x-userid", "user123");
        headers.add("x-sessionid", "session456");

        CreateUserRequest request = new CreateUserRequest(
            "testuser", "password", UserType.EMPLOYEE,
            null, null, null  // no storeNumber
        );

        StepVerifier.create(validator.validateCreateUser(request, headers))
            .expectErrorMatches(e -> e instanceof ValidationException
                && e.getMessage().contains("storeNumber"))
            .verify();
    }
}
```

### 6.2 Service Tests

```java
// src/test/java/org/example/user/service/UserServiceTest.java
package org.example.user.service;

import org.example.platform.logging.StructuredLogger;
import org.example.user.controller.dto.CreateUserRequest;
import org.example.user.domain.Permission;
import org.example.user.domain.User;
import org.example.user.domain.UserType;
import org.example.user.repository.UserPreferencesRepository;
import org.example.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private StructuredLogger logger;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserPreferencesRepository preferencesRepository;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(logger, userRepository, preferencesRepository);
    }

    @Test
    void getDefaultPermissions_employee_hasAllPermissions() {
        Set<Permission> permissions = userService.getDefaultPermissions(UserType.EMPLOYEE);

        assertThat(permissions).containsExactlyInAnyOrder(
            Permission.READ, Permission.WRITE, Permission.ADMIN, Permission.CUSTOMER_SEARCH
        );
    }

    @Test
    void getDefaultPermissions_customer_hasReadWrite() {
        Set<Permission> permissions = userService.getDefaultPermissions(UserType.CUSTOMER);

        assertThat(permissions).containsExactlyInAnyOrder(Permission.READ, Permission.WRITE);
    }

    @Test
    void getDefaultPermissions_serviceAccount_hasReadOnly() {
        Set<Permission> permissions = userService.getDefaultPermissions(UserType.SERVICE_ACCOUNT);

        assertThat(permissions).containsExactly(Permission.READ);
    }

    @Test
    void scopeString_formatsCorrectly() {
        User user = createTestUser(Set.of(Permission.READ, Permission.WRITE));

        String scope = userService.scopeString(user);

        assertThat(scope).contains("read").contains("write");
    }

    @Test
    void canSearchCustomers_employeeWithPermission_returnsTrue() {
        User employee = createTestUser(
            UserType.EMPLOYEE,
            Set.of(Permission.READ, Permission.WRITE, Permission.ADMIN, Permission.CUSTOMER_SEARCH)
        );

        assertThat(userService.canSearchCustomers(employee)).isTrue();
    }

    @Test
    void canSearchCustomers_customer_returnsFalse() {
        User customer = createTestUser(UserType.CUSTOMER, Set.of(Permission.READ, Permission.WRITE));

        assertThat(userService.canSearchCustomers(customer)).isFalse();
    }

    private User createTestUser(Set<Permission> permissions) {
        return createTestUser(UserType.CUSTOMER, permissions);
    }

    private User createTestUser(UserType userType, Set<Permission> permissions) {
        return new User(
            UUID.randomUUID(), "testuser", userType, permissions,
            userType == UserType.EMPLOYEE ? 1234 : null,
            "test@example.com", "Test User", true,
            Instant.now(), Instant.now(), null
        );
    }
}
```

### 6.3 JwtService Tests

```java
// src/test/java/org/example/user/service/JwtServiceTest.java
package org.example.user.service;

import org.example.user.domain.Permission;
import org.example.user.domain.User;
import org.example.user.domain.UserType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private UserService userService;

    @BeforeEach
    void setUp() {
        // Setup with test RSA keys
        jwtService = new JwtService("http://localhost:8089");
        userService = new UserServiceImpl(null, null, null); // For helper methods only
    }

    @Test
    void generateToken_containsExpectedClaims() {
        User user = new User(
            UUID.fromString("11111111-1111-1111-1111-111111111111"),
            "test-employee",
            UserType.EMPLOYEE,
            Set.of(Permission.READ, Permission.WRITE, Permission.ADMIN),
            1234,
            "test@example.com",
            "Test Employee",
            true,
            Instant.now(),
            Instant.now(),
            null
        );

        String token = jwtService.generateToken(user, userService);

        assertThat(token).isNotBlank();
        // Token should be 3 parts separated by dots
        assertThat(token.split("\\.")).hasSize(3);
    }
}
```

---

## Phase 7: Documentation Updates

**Files:**
- MODIFY: `CLAUDE.md` - Verify user-service is documented correctly
- MODIFY: `apps/user-service/README.md` - Update if needed
- CREATE: `apps/user-service/AGENTS.md` - If not exists

---

## Checklist

- [ ] Phase 1: Rename `model/` → `domain/`
  - [ ] Rename directory
  - [ ] Update all imports (15+ files)
  - [ ] Run tests
- [ ] Phase 2: Implement validation layer
  - [ ] Create `UserRequestValidator`
  - [ ] Update `UserController` to use validator
  - [ ] Add validation tests
- [ ] Phase 3: Fix DevTokenController layer violation
  - [ ] Add methods to `UserService`
  - [ ] Refactor `DevTokenController` to use service
  - [ ] Remove repository injection from controller
- [ ] Phase 4: Move business logic from domain models
  - [ ] Clean `User.java` record
  - [ ] Clean `UserType.java` enum
  - [ ] Add methods to `UserService`
  - [ ] Update all callers
- [ ] Phase 5: Add StructuredLogger
  - [ ] Add to `UserServiceImpl`
  - [ ] Add to `JwtService`
  - [ ] Verify log output
- [ ] Phase 6: Expand test coverage
  - [ ] `UserRequestValidatorTest`
  - [ ] `UserServiceTest`
  - [ ] `JwtServiceTest`
- [ ] Phase 7: Documentation updates
- [ ] All tests passing
- [ ] Archive 035_FAKE_AUTH_DOCKER.md

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| RENAME | `model/` → `domain/` | Package naming standard |
| CREATE | `validation/UserRequestValidator.java` | Request validation |
| MODIFY | `controller/UserController.java` | Add validation |
| MODIFY | `controller/DevTokenController.java` | Use service layer |
| MODIFY | `service/UserService.java` | Add business logic methods |
| MODIFY | `domain/User.java` | Remove business methods |
| MODIFY | `domain/UserType.java` | Remove business methods |
| MODIFY | `service/JwtService.java` | Add StructuredLogger |
| CREATE | `test/.../UserRequestValidatorTest.java` | Validator tests |
| CREATE | `test/.../UserServiceTest.java` | Service tests |
| CREATE | `test/.../JwtServiceTest.java` | JWT tests |
