package org.example.user.repository;

import java.util.UUID;
import org.example.user.repository.entity.UserPreferencesEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

/** Reactive repository for UserPreferencesEntity entities. */
@Repository
public interface UserPreferencesEntityRepository
    extends ReactiveCrudRepository<UserPreferencesEntity, UUID> {}
