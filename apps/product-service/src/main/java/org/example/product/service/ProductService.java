package org.example.product.service;

import org.example.model.product.Product;
import org.example.platform.logging.StructuredLogger;
import org.example.product.repository.inventory.InventoryRepository;
import org.example.product.repository.merchandise.MerchandiseRepository;
import org.example.product.repository.price.PriceRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ProductService {
  private static final String LOGGER_NAME = "productservice";

  private final MerchandiseRepository merchandiseRepository;
  private final PriceRepository priceRepository;
  private final InventoryRepository inventoryRepository;
  private final StructuredLogger structuredLogger;

  public ProductService(
      MerchandiseRepository merchandiseRepository,
      PriceRepository priceRepository,
      InventoryRepository inventoryRepository,
      StructuredLogger structuredLogger) {
    this.merchandiseRepository = merchandiseRepository;
    this.priceRepository = priceRepository;
    this.inventoryRepository = inventoryRepository;
    this.structuredLogger = structuredLogger;
  }

  public Mono<Product> getProduct(long sku) {
    return Mono.deferContextual(
        ctx -> {
          structuredLogger.logMessage(ctx, LOGGER_NAME, "Starting product fetch for sku: " + sku);

          return Mono.zip(
                  merchandiseRepository.getMerchandise(sku),
                  priceRepository.getPrice(sku),
                  inventoryRepository.getAvailability(sku))
              .map(
                  tuple -> {
                    var merch = tuple.getT1();
                    var pricing = tuple.getT2();
                    var inv = tuple.getT3();

                    return new Product(
                        sku,
                        merch.name(),
                        merch.description(),
                        pricing.price(),
                        pricing.originalPrice(),
                        inv.availableQuantity(),
                        merch.imageUrl(),
                        merch.category());
                  })
              .doOnSuccess(
                  product ->
                      structuredLogger.logMessage(
                          ctx, LOGGER_NAME, "Product fetch complete for sku: " + sku));
        });
  }
}
