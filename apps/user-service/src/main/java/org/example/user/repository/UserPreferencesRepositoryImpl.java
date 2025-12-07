package org.example.user.repository;

import java.time.Instant;
import java.util.UUID;
import org.example.user.model.UserPreferences;
import org.example.user.repository.entity.UserPreferencesEntity;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

/** Postgres implementation of UserPreferencesRepository. */
@Repository
public class UserPreferencesRepositoryImpl implements UserPreferencesRepository {

  private final UserPreferencesEntityRepository entityRepository;

  public UserPreferencesRepositoryImpl(UserPreferencesEntityRepository entityRepository) {
    this.entityRepository = entityRepository;
  }

  @Override
  public Mono<UserPreferences> findByUserId(UUID userId) {
    return entityRepository.findById(userId).map(this::toDomain);
  }

  @Override
  public Mono<UserPreferences> save(UserPreferences preferences) {
    return Mono.fromCallable(() -> toEntity(preferences))
        .flatMap(entityRepository::save)
        .map(this::toDomain);
  }

  // ==================== Mapping Methods ====================

  private UserPreferences toDomain(UserPreferencesEntity entity) {
    return new UserPreferences(
        entity.userId(),
        entity.locale(),
        entity.timezone(),
        entity.currency(),
        entity.marketingEmail(),
        entity.marketingSms(),
        entity.orderUpdatesEmail(),
        entity.orderUpdatesSms(),
        entity.displayTheme(),
        entity.itemsPerPage());
  }

  private UserPreferencesEntity toEntity(UserPreferences preferences) {
    return new UserPreferencesEntity(
        preferences.userId(),
        preferences.locale(),
        preferences.timezone(),
        preferences.currency(),
        preferences.marketingEmail(),
        preferences.marketingSms(),
        preferences.orderUpdatesEmail(),
        preferences.orderUpdatesSms(),
        preferences.displayTheme(),
        preferences.itemsPerPage(),
        Instant.now(),
        Instant.now());
  }
}
