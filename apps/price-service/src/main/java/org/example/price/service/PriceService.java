package org.example.price.service;

import java.time.Instant;
import org.example.price.dto.PriceResponse;
import org.example.price.dto.UpdatePriceRequest;
import org.example.price.repository.PriceEntity;
import org.example.price.repository.PriceR2dbcRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class PriceService {

  private final PriceR2dbcRepository repository;
  private final R2dbcEntityTemplate template;

  public PriceService(PriceR2dbcRepository repository, R2dbcEntityTemplate template) {
    this.repository = repository;
    this.template = template;
  }

  public Mono<PriceResponse> getPrice(Long sku) {
    return repository.findById(sku).map(this::toResponse);
  }

  public Flux<PriceEntity> listPrices(int page, int size) {
    return repository.findAllBy(PageRequest.of(page, size));
  }

  public Mono<PriceEntity> setPrice(Long sku, UpdatePriceRequest request) {
    return repository
        .findById(sku)
        .flatMap(existing -> updateExisting(existing, request))
        .switchIfEmpty(createNew(sku, request));
  }

  private Mono<PriceEntity> updateExisting(PriceEntity existing, UpdatePriceRequest request) {
    PriceEntity updated =
        new PriceEntity(
            existing.sku(),
            request.price(),
            request.originalPrice(),
            request.currency() != null ? request.currency() : existing.currency(),
            Instant.now());
    return repository.save(updated);
  }

  private Mono<PriceEntity> createNew(Long sku, UpdatePriceRequest request) {
    PriceEntity entity =
        new PriceEntity(
            sku,
            request.price(),
            request.originalPrice(),
            request.currency() != null ? request.currency() : "USD",
            Instant.now());
    // Use template.insert() instead of repository.save() because R2DBC treats
    // non-null @Id as existing entity and issues UPDATE instead of INSERT
    return template.insert(entity);
  }

  private PriceResponse toResponse(PriceEntity entity) {
    return new PriceResponse(entity.price(), entity.originalPrice(), entity.currency());
  }
}
