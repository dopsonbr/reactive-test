package org.example.inventory.service;

import java.time.Instant;
import org.example.inventory.dto.InventoryResponse;
import org.example.inventory.dto.UpdateInventoryRequest;
import org.example.inventory.repository.StockEntity;
import org.example.inventory.repository.StockR2dbcRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class InventoryService {

  private final StockR2dbcRepository repository;
  private final R2dbcEntityTemplate template;

  public InventoryService(StockR2dbcRepository repository, R2dbcEntityTemplate template) {
    this.repository = repository;
    this.template = template;
  }

  public Mono<InventoryResponse> getInventory(Long sku) {
    return repository.findById(sku).map(this::toResponse);
  }

  public Flux<StockEntity> listInventory(int page, int size) {
    return repository.findAllBy(PageRequest.of(page, size));
  }

  public Flux<StockEntity> getLowStock(int threshold) {
    return repository.findByAvailableQuantityLessThan(threshold);
  }

  public Mono<StockEntity> updateInventory(Long sku, UpdateInventoryRequest request) {
    return repository
        .findById(sku)
        .flatMap(existing -> updateExisting(existing, request))
        .switchIfEmpty(createNew(sku, request));
  }

  private Mono<StockEntity> updateExisting(StockEntity existing, UpdateInventoryRequest request) {
    StockEntity updated =
        new StockEntity(existing.sku(), request.availableQuantity(), Instant.now());
    return repository.save(updated);
  }

  private Mono<StockEntity> createNew(Long sku, UpdateInventoryRequest request) {
    StockEntity entity = new StockEntity(sku, request.availableQuantity(), Instant.now());
    // Use template.insert() instead of repository.save() because R2DBC treats
    // non-null @Id as existing entity and issues UPDATE instead of INSERT
    return template.insert(entity);
  }

  private InventoryResponse toResponse(StockEntity entity) {
    return new InventoryResponse(entity.availableQuantity());
  }
}
