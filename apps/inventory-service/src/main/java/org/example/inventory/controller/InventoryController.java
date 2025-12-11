package org.example.inventory.controller;

import jakarta.validation.Valid;
import org.example.inventory.dto.InventoryResponse;
import org.example.inventory.dto.UpdateInventoryRequest;
import org.example.inventory.repository.StockEntity;
import org.example.inventory.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

  private final InventoryService service;

  public InventoryController(InventoryService service) {
    this.service = service;
  }

  /** Get inventory by SKU - used by product-service (service-to-service). */
  @GetMapping("/{sku}")
  public Mono<ResponseEntity<InventoryResponse>> getInventory(@PathVariable Long sku) {
    return service
        .getInventory(sku)
        .map(ResponseEntity::ok)
        .defaultIfEmpty(ResponseEntity.notFound().build());
  }

  /** List all inventory - used by merchant portal. */
  @GetMapping
  public Flux<StockEntity> listInventory(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
    return service.listInventory(page, size);
  }

  /** Get low stock items - used by merchant portal for alerts. */
  @GetMapping("/low-stock")
  public Flux<StockEntity> getLowStock(@RequestParam(defaultValue = "10") int threshold) {
    return service.getLowStock(threshold);
  }

  /** Update inventory - used by merchant portal (requires INVENTORY_SPECIALIST role). */
  @PutMapping("/{sku}")
  public Mono<StockEntity> updateInventory(
      @PathVariable Long sku, @Valid @RequestBody UpdateInventoryRequest request) {
    return service.updateInventory(sku, request);
  }
}
