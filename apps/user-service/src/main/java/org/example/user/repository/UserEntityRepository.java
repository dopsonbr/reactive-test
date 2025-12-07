package org.example.user.repository;

import java.util.UUID;
import org.example.user.repository.entity.UserEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

/** Reactive repository for UserEntity entities. */
@Repository
public interface UserEntityRepository extends ReactiveCrudRepository<UserEntity, UUID> {

  Mono<UserEntity> findByUsername(String username);

  Mono<UserEntity> findByUsernameAndActiveTrue(String username);
}
