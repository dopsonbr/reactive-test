package org.example.fulfillment.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.example.fulfillment.dto.*;
import org.example.platform.logging.StructuredLogger;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.util.context.ContextView;

/**
 * Stub service for fulfillment operations. Returns hardcoded responses for checkout integration.
 */
@Service
public class FulfillmentService {

  private static final String LOGGER_NAME = "fulfillmentservice";

  private final StructuredLogger logger;

  public FulfillmentService(StructuredLogger logger) {
    this.logger = logger;
  }

  public Mono<FulfillmentCostResponse> calculateCost(
      ContextView ctx, FulfillmentCostRequest request) {
    BigDecimal cost =
        switch (request.type()) {
          case DELIVERY -> new BigDecimal("9.99");
          case PICKUP -> BigDecimal.ZERO;
          case WILL_CALL -> BigDecimal.ZERO;
          case INSTALLATION -> new BigDecimal("49.99");
        };
    logger.logMessage(
        ctx,
        LOGGER_NAME,
        String.format("Calculated fulfillment cost: type=%s, cost=%s", request.type(), cost));
    return Mono.just(new FulfillmentCostResponse(cost.toString()));
  }

  public Mono<FulfillmentPlanResponse> createPlan(ContextView ctx, FulfillmentPlanRequest request) {
    String planId = "PLAN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    List<FulfillmentPlanResponse.FulfillmentLineItem> lineItems =
        request.skus().stream()
            .map(
                sku ->
                    new FulfillmentPlanResponse.FulfillmentLineItem(
                        sku, request.type().name(), "WAREHOUSE-001"))
            .toList();

    logger.logMessage(
        ctx,
        LOGGER_NAME,
        String.format("Created fulfillment plan: planId=%s, cartId=%s", planId, request.cartId()));

    return Mono.just(
        new FulfillmentPlanResponse(
            planId, "CREATED", new BigDecimal("9.99"), LocalDate.now().plusDays(5), lineItems));
  }

  public Mono<ReservationResponse> createReservation(ContextView ctx, ReservationRequest request) {
    String reservationId = "RES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    Instant expiresAt = Instant.now().plusSeconds(request.ttlMinutes() * 60L);

    logger.logMessage(
        ctx,
        LOGGER_NAME,
        String.format(
            "Created reservation: reservationId=%s, planId=%s", reservationId, request.planId()));

    return Mono.just(
        new ReservationResponse(reservationId, request.planId(), "RESERVED", expiresAt));
  }

  public Mono<AddressValidationResponse> validateAddress(
      ContextView ctx, AddressValidationRequest request) {
    // Stub: all addresses are valid and deliverable
    String normalized =
        String.format(
            "%s, %s, %s %s",
            request.addressLine1(), request.city(), request.state(), request.zipCode());

    logger.logMessage(
        ctx,
        LOGGER_NAME,
        String.format("Validated address: zipCode=%s, valid=true", request.zipCode()));

    return Mono.just(
        new AddressValidationResponse(true, true, normalized, "Address validated successfully"));
  }

  public Mono<ShippingOptionsResponse> getShippingOptions(ContextView ctx, String zipCode) {
    List<ShippingOption> options =
        List.of(
            new ShippingOption(
                "STANDARD", "Standard Shipping", "5-7 business days", new BigDecimal("5.99"), 5, 7),
            new ShippingOption(
                "EXPRESS", "Express Shipping", "2-3 business days", new BigDecimal("12.99"), 2, 3),
            new ShippingOption(
                "OVERNIGHT",
                "Overnight Shipping",
                "Next business day",
                new BigDecimal("24.99"),
                1,
                1));

    logger.logMessage(
        ctx,
        LOGGER_NAME,
        String.format(
            "Retrieved shipping options: zipCode=%s, optionCount=%d", zipCode, options.size()));

    return Mono.just(new ShippingOptionsResponse(options));
  }
}
