package org.example.reactivetest.controller;

import org.example.reactivetest.context.ContextKeys;
import org.example.reactivetest.context.RequestMetadata;
import org.example.reactivetest.domain.Product;
import org.example.reactivetest.logging.RequestLogData;
import org.example.reactivetest.logging.ResponseLogData;
import org.example.reactivetest.logging.StructuredLogger;
import org.example.reactivetest.service.ProductService;
import org.example.reactivetest.validation.RequestValidator;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/products")
public class ProductController {
    private static final String LOGGER_NAME = "productscontroller";

    private final ProductService productService;
    private final StructuredLogger structuredLogger;
    private final RequestValidator requestValidator;

    public ProductController(ProductService productService, StructuredLogger structuredLogger,
                             RequestValidator requestValidator) {
        this.productService = productService;
        this.structuredLogger = structuredLogger;
        this.requestValidator = requestValidator;
    }

    @GetMapping("/{sku}")
    public Mono<Product> getProduct(
        @PathVariable long sku,
        @RequestHeader("x-store-number") int storeNumber,
        @RequestHeader("x-order-number") String orderNumber,
        @RequestHeader("x-userid") String userId,
        @RequestHeader("x-sessionid") String sessionId,
        ServerHttpRequest request
    ) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return requestValidator.validateProductRequest(sku, storeNumber, orderNumber, userId, sessionId)
            .then(Mono.deferContextual(ctx -> {
                // Log inbound request
                RequestLogData requestData = new RequestLogData(
                    "/products/{sku}",
                    request.getURI().getPath(),
                    request.getMethod().name(),
                    null
                );
                structuredLogger.logRequest(ctx, LOGGER_NAME, requestData);

                return productService.getProduct(sku)
                    .doOnSuccess(product -> {
                        // Log outbound response
                        ResponseLogData responseData = new ResponseLogData(
                            "/products/{sku}",
                            request.getURI().getPath(),
                            request.getMethod().name(),
                            200,
                            product
                        );
                        structuredLogger.logResponse(ctx, LOGGER_NAME, responseData);
                    });
            }))
            .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }
}
