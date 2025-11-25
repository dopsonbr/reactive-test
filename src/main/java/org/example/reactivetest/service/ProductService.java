package org.example.reactivetest.service;

import org.example.reactivetest.domain.Product;
import org.example.reactivetest.logging.StructuredLogger;
import org.example.reactivetest.repository.inventory.InventoryRepository;
import org.example.reactivetest.repository.merchandise.MerchandiseRepository;
import org.example.reactivetest.repository.price.PriceRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ProductService {
    private final MerchandiseRepository merchandiseRepository;
    private final PriceRepository priceRepository;
    private final InventoryRepository inventoryRepository;
    private final StructuredLogger structuredLogger;

    public ProductService(
        MerchandiseRepository merchandiseRepository,
        PriceRepository priceRepository,
        InventoryRepository inventoryRepository,
        StructuredLogger structuredLogger
    ) {
        this.merchandiseRepository = merchandiseRepository;
        this.priceRepository = priceRepository;
        this.inventoryRepository = inventoryRepository;
        this.structuredLogger = structuredLogger;
    }

    public Mono<Product> getProduct(long sku) {
        return Mono.deferContextual(ctx -> {
            structuredLogger.logMessage(ctx, "productservice", "Starting product fetch for sku: " + sku);

            return Mono.zip(
                merchandiseRepository.getDescription(sku),
                priceRepository.getPrice(sku),
                inventoryRepository.getAvailability(sku)
            )
            .map(tuple -> new Product(
                sku,
                tuple.getT1().description(),
                tuple.getT2().price(),
                tuple.getT3().availableQuantity()
            ))
            .doOnSuccess(product ->
                structuredLogger.logMessage(ctx, "productservice", "Product fetch complete for sku: " + sku)
            );
        });
    }
}
