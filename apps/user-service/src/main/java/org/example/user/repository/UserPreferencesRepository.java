package org.example.user.repository;

import java.util.UUID;
import org.example.user.model.UserPreferences;
import reactor.core.publisher.Mono;

/** Domain repository interface for UserPreferences. */
public interface UserPreferencesRepository {

  Mono<UserPreferences> findByUserId(UUID userId);

  Mono<UserPreferences> save(UserPreferences preferences);
}
