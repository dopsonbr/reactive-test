package org.example.customer.controller;

import org.example.customer.controller.dto.CreateCustomerRequest;
import org.example.customer.controller.dto.CustomerSearchRequest;
import org.example.customer.controller.dto.UpdateCustomerRequest;
import org.example.customer.service.CustomerService;
import org.example.customer.validation.CustomerRequestValidator;
import org.example.model.customer.Customer;
import org.example.platform.logging.RequestLogData;
import org.example.platform.logging.ResponseLogData;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.context.ContextView;

/**
 * REST controller for customer operations. Supports CRUD and search for both D2C and B2B customers.
 */
@RestController
@RequestMapping("/customers")
public class CustomerController {

    private static final String LOGGER_NAME = "customercontroller";

    private final CustomerService customerService;
    private final CustomerRequestValidator validator;
    private final StructuredLogger structuredLogger;

    public CustomerController(
            CustomerService customerService,
            CustomerRequestValidator validator,
            StructuredLogger structuredLogger) {
        this.customerService = customerService;
        this.validator = validator;
        this.structuredLogger = structuredLogger;
    }

    /** Get customer by ID. */
    @GetMapping("/{customerId}")
    @PreAuthorize("hasAuthority('SCOPE_customer:read')")
    public Mono<Customer> getCustomer(
            @PathVariable String customerId,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId,
            ServerHttpRequest httpRequest) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(
                        ctx -> {
                            logRequest(ctx, httpRequest);
                            return validator
                                    .validateGetRequest(
                                            customerId, storeNumber, orderNumber, userId, sessionId)
                                    .then(customerService.getCustomer(customerId))
                                    .doOnSuccess(
                                            result -> logResponse(ctx, httpRequest, 200, result));
                        })
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /** Create a new customer. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('SCOPE_customer:write')")
    public Mono<Customer> createCustomer(
            @RequestBody CreateCustomerRequest request,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId,
            ServerHttpRequest httpRequest) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(
                        ctx -> {
                            logRequest(ctx, httpRequest);
                            return validator
                                    .validateCreateRequest(
                                            request, storeNumber, orderNumber, userId, sessionId)
                                    .then(customerService.createCustomer(ctx, request))
                                    .doOnSuccess(
                                            result -> logResponse(ctx, httpRequest, 201, result));
                        })
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /** Update an existing customer. */
    @PutMapping("/{customerId}")
    @PreAuthorize("hasAuthority('SCOPE_customer:write')")
    public Mono<Customer> updateCustomer(
            @PathVariable String customerId,
            @RequestBody UpdateCustomerRequest request,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId,
            ServerHttpRequest httpRequest) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(
                        ctx -> {
                            logRequest(ctx, httpRequest);
                            return validator
                                    .validateUpdateRequest(
                                            request,
                                            customerId,
                                            storeNumber,
                                            orderNumber,
                                            userId,
                                            sessionId)
                                    .then(customerService.updateCustomer(ctx, customerId, request))
                                    .doOnSuccess(
                                            result -> logResponse(ctx, httpRequest, 200, result));
                        })
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /** Delete a customer. */
    @DeleteMapping("/{customerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('SCOPE_customer:delete')")
    public Mono<Void> deleteCustomer(
            @PathVariable String customerId,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId,
            ServerHttpRequest httpRequest) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(
                        ctx -> {
                            logRequest(ctx, httpRequest);
                            return validator
                                    .validateGetRequest(
                                            customerId, storeNumber, orderNumber, userId, sessionId)
                                    .then(customerService.deleteCustomer(ctx, customerId))
                                    .doOnSuccess(v -> logResponse(ctx, httpRequest, 204, null));
                        })
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /** Search customers by ID, email, or phone. */
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('SCOPE_customer:read')")
    public Flux<Customer> searchCustomers(
            @RequestParam(required = false) String customerId,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId,
            ServerHttpRequest httpRequest) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);
        CustomerSearchRequest searchRequest = new CustomerSearchRequest(customerId, email, phone);

        return Flux.deferContextual(
                        ctx -> {
                            logRequest(ctx, httpRequest);
                            return validator
                                    .validateSearchRequest(
                                            searchRequest,
                                            storeNumber,
                                            orderNumber,
                                            userId,
                                            sessionId)
                                    .thenMany(
                                            customerService.search(
                                                    storeNumber, searchRequest.getSearchTerm()));
                        })
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /** Get B2B sub-accounts for a parent customer. */
    @GetMapping("/{customerId}/sub-accounts")
    @PreAuthorize("hasAuthority('SCOPE_customer:read')")
    public Flux<Customer> getSubAccounts(
            @PathVariable String customerId,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId,
            ServerHttpRequest httpRequest) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Flux.deferContextual(
                        ctx -> {
                            logRequest(ctx, httpRequest);
                            return validator
                                    .validateGetRequest(
                                            customerId, storeNumber, orderNumber, userId, sessionId)
                                    .thenMany(customerService.getSubAccounts(customerId));
                        })
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    /** Create a B2B sub-account under a parent customer. */
    @PostMapping("/{customerId}/sub-accounts")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('SCOPE_customer:write')")
    public Mono<Customer> createSubAccount(
            @PathVariable String customerId,
            @RequestBody CreateCustomerRequest request,
            @RequestHeader("x-store-number") int storeNumber,
            @RequestHeader("x-order-number") String orderNumber,
            @RequestHeader("x-userid") String userId,
            @RequestHeader("x-sessionid") String sessionId,
            ServerHttpRequest httpRequest) {

        RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

        return Mono.deferContextual(
                        ctx -> {
                            logRequest(ctx, httpRequest);
                            return validator
                                    .validateCreateRequest(
                                            request, storeNumber, orderNumber, userId, sessionId)
                                    .then(
                                            customerService.createSubAccount(
                                                    ctx, customerId, request))
                                    .doOnSuccess(
                                            result -> logResponse(ctx, httpRequest, 201, result));
                        })
                .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
    }

    private void logRequest(ContextView ctx, ServerHttpRequest request) {
        RequestLogData requestData =
                new RequestLogData(
                        request.getURI().getPath(),
                        request.getURI().toString(),
                        request.getMethod().name(),
                        request.getQueryParams().toSingleValueMap());
        structuredLogger.logRequest(ctx, LOGGER_NAME, requestData);
    }

    private void logResponse(ContextView ctx, ServerHttpRequest request, int status, Object body) {
        ResponseLogData responseData =
                new ResponseLogData(
                        request.getURI().getPath(),
                        request.getURI().toString(),
                        request.getMethod().name(),
                        status,
                        body);
        structuredLogger.logResponse(ctx, LOGGER_NAME, responseData);
    }
}
