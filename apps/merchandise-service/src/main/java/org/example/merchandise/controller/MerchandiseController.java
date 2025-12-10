package org.example.merchandise.controller;

import jakarta.validation.Valid;
import org.example.merchandise.dto.CreateProductRequest;
import org.example.merchandise.dto.MerchandiseResponse;
import org.example.merchandise.dto.UpdateProductRequest;
import org.example.merchandise.repository.ProductEntity;
import org.example.merchandise.service.MerchandiseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/merchandise")
public class MerchandiseController {

  private final MerchandiseService service;

  public MerchandiseController(MerchandiseService service) {
    this.service = service;
  }

  /**
   * Get product by SKU - used by product-service (service-to-service).
   * Returns the contract expected by product-service's MerchandiseRepository.
   */
  @GetMapping("/{sku}")
  public Mono<ResponseEntity<MerchandiseResponse>> getProduct(@PathVariable Long sku) {
    return service
        .getProduct(sku)
        .map(ResponseEntity::ok)
        .defaultIfEmpty(ResponseEntity.notFound().build());
  }

  /**
   * List all products - used by merchant portal.
   */
  @GetMapping
  public Flux<ProductEntity> listProducts(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return service.listProducts(page, size);
  }

  /**
   * Create product - used by merchant portal (requires MERCHANT role).
   */
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Mono<ProductEntity> createProduct(@Valid @RequestBody CreateProductRequest request) {
    return service.createProduct(request);
  }

  /**
   * Update product - used by merchant portal (requires MERCHANT role).
   */
  @PutMapping("/{sku}")
  public Mono<ResponseEntity<ProductEntity>> updateProduct(
      @PathVariable Long sku,
      @Valid @RequestBody UpdateProductRequest request) {
    return service
        .updateProduct(sku, request)
        .map(ResponseEntity::ok)
        .defaultIfEmpty(ResponseEntity.notFound().build());
  }

  /**
   * Delete product - used by merchant portal (requires MERCHANT role).
   */
  @DeleteMapping("/{sku}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public Mono<Void> deleteProduct(@PathVariable Long sku) {
    return service.deleteProduct(sku);
  }
}
