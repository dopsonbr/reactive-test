package org.example.user.repository;

import java.util.UUID;
import org.example.user.model.User;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Domain repository interface for User.
 *
 * <p>Defines operations in terms of domain objects, not database entities.
 */
public interface UserRepository {

  Mono<User> findById(UUID id);

  Mono<User> findByUsername(String username);

  Mono<User> findActiveByUsername(String username);

  Mono<User> save(User user, String passwordHash);

  Mono<User> updateLastLogin(UUID id);

  Flux<User> findAll();

  /** Get password hash for a user (needed for UserDetailsService). */
  Mono<String> getPasswordHash(String username);
}
