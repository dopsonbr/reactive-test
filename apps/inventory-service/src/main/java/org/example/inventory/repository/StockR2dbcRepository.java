package org.example.inventory.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface StockR2dbcRepository extends R2dbcRepository<StockEntity, Long> {

  Flux<StockEntity> findAllBy(Pageable pageable);

  Flux<StockEntity> findByAvailableQuantityLessThan(int threshold);
}
