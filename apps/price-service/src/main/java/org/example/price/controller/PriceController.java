package org.example.price.controller;

import jakarta.validation.Valid;
import org.example.price.dto.PriceResponse;
import org.example.price.dto.UpdatePriceRequest;
import org.example.price.repository.PriceEntity;
import org.example.price.service.PriceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/price")
public class PriceController {

  private final PriceService service;

  public PriceController(PriceService service) {
    this.service = service;
  }

  /**
   * Get price by SKU - used by product-service (service-to-service).
   */
  @GetMapping("/{sku}")
  public Mono<ResponseEntity<PriceResponse>> getPrice(@PathVariable Long sku) {
    return service
        .getPrice(sku)
        .map(ResponseEntity::ok)
        .defaultIfEmpty(ResponseEntity.notFound().build());
  }

  /**
   * List all prices - used by merchant portal.
   */
  @GetMapping
  public Flux<PriceEntity> listPrices(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return service.listPrices(page, size);
  }

  /**
   * Set/update price - used by merchant portal (requires PRICING_SPECIALIST role).
   */
  @PutMapping("/{sku}")
  public Mono<PriceEntity> setPrice(
      @PathVariable Long sku,
      @Valid @RequestBody UpdatePriceRequest request) {
    return service.setPrice(sku, request);
  }
}
