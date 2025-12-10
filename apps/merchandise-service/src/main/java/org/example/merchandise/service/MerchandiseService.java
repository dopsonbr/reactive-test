package org.example.merchandise.service;

import java.time.Instant;
import org.example.merchandise.dto.CreateProductRequest;
import org.example.merchandise.dto.MerchandiseResponse;
import org.example.merchandise.dto.UpdateProductRequest;
import org.example.merchandise.repository.ProductEntity;
import org.example.merchandise.repository.ProductR2dbcRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class MerchandiseService {

  private final ProductR2dbcRepository repository;

  public MerchandiseService(ProductR2dbcRepository repository) {
    this.repository = repository;
  }

  public Mono<MerchandiseResponse> getProduct(Long sku) {
    return repository.findById(sku).map(this::toResponse);
  }

  public Flux<ProductEntity> listProducts(int page, int size) {
    return repository.findAllBy(PageRequest.of(page, size));
  }

  public Mono<ProductEntity> createProduct(CreateProductRequest request) {
    Instant now = Instant.now();
    ProductEntity entity =
        new ProductEntity(
            request.sku(),
            request.name(),
            request.description(),
            request.imageUrl(),
            request.category(),
            request.suggestedRetailPrice(),
            request.currency() != null ? request.currency() : "USD",
            now,
            now);
    return repository.save(entity);
  }

  public Mono<ProductEntity> updateProduct(Long sku, UpdateProductRequest request) {
    return repository
        .findById(sku)
        .flatMap(
            existing -> {
              ProductEntity updated =
                  new ProductEntity(
                      existing.sku(),
                      request.name() != null ? request.name() : existing.name(),
                      request.description() != null
                          ? request.description()
                          : existing.description(),
                      request.imageUrl() != null ? request.imageUrl() : existing.imageUrl(),
                      request.category() != null ? request.category() : existing.category(),
                      request.suggestedRetailPrice() != null
                          ? request.suggestedRetailPrice()
                          : existing.suggestedRetailPrice(),
                      request.currency() != null ? request.currency() : existing.currency(),
                      existing.createdAt(),
                      Instant.now());
              return repository.save(updated);
            });
  }

  public Mono<Void> deleteProduct(Long sku) {
    return repository.deleteById(sku);
  }

  private MerchandiseResponse toResponse(ProductEntity entity) {
    return new MerchandiseResponse(
        entity.name(), entity.description(), entity.imageUrl(), entity.category());
  }
}
