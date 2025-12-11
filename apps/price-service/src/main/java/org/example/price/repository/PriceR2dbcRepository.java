package org.example.price.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface PriceR2dbcRepository extends R2dbcRepository<PriceEntity, Long> {

  Flux<PriceEntity> findAllBy(Pageable pageable);
}
