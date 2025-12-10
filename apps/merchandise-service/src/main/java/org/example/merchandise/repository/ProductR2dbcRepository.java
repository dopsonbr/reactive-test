package org.example.merchandise.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface ProductR2dbcRepository extends R2dbcRepository<ProductEntity, Long> {

  Flux<ProductEntity> findAllBy(Pageable pageable);

  Flux<ProductEntity> findByCategory(String category, Pageable pageable);
}
