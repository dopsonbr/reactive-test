package org.example.fulfillment.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.example.fulfillment.dto.*;
import org.example.model.fulfillment.FulfillmentType;
import org.example.platform.logging.StructuredLogger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

class FulfillmentServiceTest {

  private FulfillmentService service;
  private StructuredLogger mockLogger;

  @BeforeEach
  void setUp() {
    mockLogger = mock(StructuredLogger.class);
    doNothing().when(mockLogger).logMessage(any(), anyString(), anyString());
    service = new FulfillmentService(mockLogger);
  }

  @Test
  void calculateCost_delivery_returns999() {
    FulfillmentCostRequest request =
        new FulfillmentCostRequest(FulfillmentType.DELIVERY, List.of(1001L));

    Mono<FulfillmentCostResponse> result = service.calculateCost(Context.empty(), request);

    StepVerifier.create(result)
        .assertNext(
            response -> {
              assertThat(response.cost()).isEqualTo("9.99");
            })
        .verifyComplete();
  }

  @Test
  void calculateCost_pickup_returnsZero() {
    FulfillmentCostRequest request =
        new FulfillmentCostRequest(FulfillmentType.PICKUP, List.of(1001L));

    Mono<FulfillmentCostResponse> result = service.calculateCost(Context.empty(), request);

    StepVerifier.create(result)
        .assertNext(
            response -> {
              assertThat(response.cost()).isEqualTo("0");
            })
        .verifyComplete();
  }

  @Test
  void calculateCost_installation_returns4999() {
    FulfillmentCostRequest request =
        new FulfillmentCostRequest(FulfillmentType.INSTALLATION, List.of(1001L));

    Mono<FulfillmentCostResponse> result = service.calculateCost(Context.empty(), request);

    StepVerifier.create(result)
        .assertNext(
            response -> {
              assertThat(response.cost()).isEqualTo("49.99");
            })
        .verifyComplete();
  }

  @Test
  void createPlan_returnsValidPlan() {
    FulfillmentPlanRequest request =
        new FulfillmentPlanRequest(
            "cart-123", FulfillmentType.DELIVERY, List.of(1001L, 1002L), "12345");

    Mono<FulfillmentPlanResponse> result = service.createPlan(Context.empty(), request);

    StepVerifier.create(result)
        .assertNext(
            response -> {
              assertThat(response.planId()).startsWith("PLAN-");
              assertThat(response.status()).isEqualTo("CREATED");
              assertThat(response.estimatedCost()).isEqualTo(new BigDecimal("9.99"));
              assertThat(response.estimatedDeliveryDate()).isAfter(LocalDate.now());
              assertThat(response.lineItems()).hasSize(2);
              assertThat(response.lineItems().get(0).sku()).isEqualTo(1001L);
              assertThat(response.lineItems().get(0).fulfillmentMethod()).isEqualTo("DELIVERY");
              assertThat(response.lineItems().get(0).sourceLocation()).isEqualTo("WAREHOUSE-001");
            })
        .verifyComplete();
  }

  @Test
  void createReservation_returnsValidReservation() {
    ReservationRequest request = new ReservationRequest("PLAN-12345678", "cart-123", 30);

    Mono<ReservationResponse> result = service.createReservation(Context.empty(), request);

    StepVerifier.create(result)
        .assertNext(
            response -> {
              assertThat(response.reservationId()).startsWith("RES-");
              assertThat(response.planId()).isEqualTo("PLAN-12345678");
              assertThat(response.status()).isEqualTo("RESERVED");
              assertThat(response.expiresAt()).isNotNull();
            })
        .verifyComplete();
  }

  @Test
  void validateAddress_returnsValidResponse() {
    AddressValidationRequest request =
        new AddressValidationRequest("123 Main St", null, "Springfield", "IL", "62701", "US");

    Mono<AddressValidationResponse> result = service.validateAddress(Context.empty(), request);

    StepVerifier.create(result)
        .assertNext(
            response -> {
              assertThat(response.valid()).isTrue();
              assertThat(response.deliverable()).isTrue();
              assertThat(response.normalizedAddress()).contains("123 Main St");
              assertThat(response.normalizedAddress()).contains("Springfield");
              assertThat(response.validationMessage()).isEqualTo("Address validated successfully");
            })
        .verifyComplete();
  }

  @Test
  void getShippingOptions_returnsThreeOptions() {
    Mono<ShippingOptionsResponse> result = service.getShippingOptions(Context.empty(), "12345");

    StepVerifier.create(result)
        .assertNext(
            response -> {
              assertThat(response.options()).hasSize(3);

              ShippingOption standard = response.options().get(0);
              assertThat(standard.optionId()).isEqualTo("STANDARD");
              assertThat(standard.cost()).isEqualTo(new BigDecimal("5.99"));
              assertThat(standard.estimatedDaysMin()).isEqualTo(5);
              assertThat(standard.estimatedDaysMax()).isEqualTo(7);

              ShippingOption express = response.options().get(1);
              assertThat(express.optionId()).isEqualTo("EXPRESS");
              assertThat(express.cost()).isEqualTo(new BigDecimal("12.99"));

              ShippingOption overnight = response.options().get(2);
              assertThat(overnight.optionId()).isEqualTo("OVERNIGHT");
              assertThat(overnight.cost()).isEqualTo(new BigDecimal("24.99"));
            })
        .verifyComplete();
  }
}
