package org.example.user.repository;

import java.time.Instant;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.example.user.model.Permission;
import org.example.user.model.User;
import org.example.user.model.UserType;
import org.example.user.repository.entity.UserEntity;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Postgres implementation of UserRepository.
 *
 * <p>Converts between domain User objects and UserEntity database records.
 */
@Repository
public class UserRepositoryImpl implements UserRepository {

  private final UserEntityRepository entityRepository;

  public UserRepositoryImpl(UserEntityRepository entityRepository) {
    this.entityRepository = entityRepository;
  }

  @Override
  public Mono<User> findById(UUID id) {
    return entityRepository.findById(id).map(this::toDomain);
  }

  @Override
  public Mono<User> findByUsername(String username) {
    return entityRepository.findByUsername(username).map(this::toDomain);
  }

  @Override
  public Mono<User> findActiveByUsername(String username) {
    return entityRepository.findByUsernameAndActiveTrue(username).map(this::toDomain);
  }

  @Override
  public Mono<User> save(User user, String passwordHash) {
    return Mono.fromCallable(() -> toEntity(user, passwordHash))
        .flatMap(entityRepository::save)
        .map(this::toDomain);
  }

  @Override
  public Mono<User> updateLastLogin(UUID id) {
    return entityRepository
        .findById(id)
        .flatMap(
            entity -> {
              UserEntity updated =
                  new UserEntity(
                      entity.id(),
                      entity.username(),
                      entity.passwordHash(),
                      entity.userType(),
                      entity.permissions(),
                      entity.storeNumber(),
                      entity.email(),
                      entity.displayName(),
                      entity.active(),
                      entity.createdAt(),
                      entity.updatedAt(),
                      Instant.now());
              return entityRepository.save(updated);
            })
        .map(this::toDomain);
  }

  @Override
  public Flux<User> findAll() {
    return entityRepository.findAll().map(this::toDomain);
  }

  @Override
  public Mono<String> getPasswordHash(String username) {
    return entityRepository.findByUsernameAndActiveTrue(username).map(UserEntity::passwordHash);
  }

  // ==================== Mapping Methods ====================

  private User toDomain(UserEntity entity) {
    Set<Permission> permissions =
        Arrays.stream(entity.permissions())
            .map(String::toUpperCase)
            .map(Permission::valueOf)
            .collect(Collectors.toSet());

    return new User(
        entity.id(),
        entity.username(),
        UserType.valueOf(entity.userType()),
        permissions,
        entity.storeNumber(),
        entity.email(),
        entity.displayName(),
        entity.active(),
        entity.createdAt(),
        entity.updatedAt(),
        entity.lastLoginAt());
  }

  private UserEntity toEntity(User user, String passwordHash) {
    String[] permissions =
        user.permissions().stream().map(p -> p.name().toLowerCase()).toArray(String[]::new);

    return new UserEntity(
        user.id() != null ? user.id() : UUID.randomUUID(),
        user.username(),
        passwordHash,
        user.userType().name(),
        permissions,
        user.storeNumber(),
        user.email(),
        user.displayName(),
        user.active(),
        user.createdAt() != null ? user.createdAt() : Instant.now(),
        Instant.now(),
        user.lastLoginAt());
  }
}
