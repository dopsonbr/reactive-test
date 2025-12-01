package org.example.product.controller;

import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.example.platform.logging.RequestLogData;
import org.example.platform.logging.ResponseLogData;
import org.example.platform.logging.StructuredLogger;
import org.example.product.domain.Product;
import org.example.product.service.ProductService;
import org.example.product.validation.ProductRequestValidator;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/products")
public class ProductController {
    private static final String LOGGER_NAME = "productscontroller";

    private final ProductService productService;
    private final StructuredLogger structuredLogger;
    private final ProductRequestValidator requestValidator;

    public ProductController(ProductService productService, StructuredLogger structuredLogger,
                             ProductRequestValidator requestValidator) {
        this.productService = productService;
        this.structuredLogger = structuredLogger;
        this.requestValidator = requestValidator;
    }

    @GetMapping("/{sku}")
    @PreAuthorize("hasAuthority('SCOPE_product:read')")
    public Mono<Product> getProduct(
        @PathVariable long sku,
        @RequestHeader("x-store-number") int storeNumber,
        @RequestHeader("x-order-number") String orderNumber,
        @RequestHeader("x-userid") String userId,
        @RequestHeader("x-sessionid") String sessionId,
        @AuthenticationPrincipal Jwt jwt,
        ServerHttpRequest request
    ) {
        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return requestValidator.validateProductRequest(sku, storeNumber, orderNumber, userId, sessionId)
            .then(Mono.deferContextual(ctx -> {
                // Log inbound request with authenticated subject
                String subject = jwt != null ? jwt.getSubject() : "unknown";
                RequestLogData requestData = new RequestLogData(
                    "/products/{sku}",
                    request.getURI().getPath(),
                    request.getMethod().name(),
                    subject
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
