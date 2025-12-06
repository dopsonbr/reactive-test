package org.example.fulfillment.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.example.fulfillment.dto.*;
import org.example.fulfillment.service.FulfillmentService;
import org.example.model.fulfillment.FulfillmentType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webflux.test.autoconfigure.WebFluxTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

@WebFluxTest(FulfillmentController.class)
@Import(TestSecurityConfig.class)
class FulfillmentControllerTest {

  @Autowired private WebTestClient webTestClient;

  @MockitoBean private FulfillmentService fulfillmentService;

  @Test
  void calculateCost_returnsOk() {
    FulfillmentCostResponse response = new FulfillmentCostResponse("9.99");
    when(fulfillmentService.calculateCost(any(), any(FulfillmentCostRequest.class)))
        .thenReturn(Mono.just(response));

    webTestClient
        .post()
        .uri("/fulfillments/calculate")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(new FulfillmentCostRequest(FulfillmentType.DELIVERY, List.of(1001L)))
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.cost")
        .isEqualTo("9.99");
  }

  @Test
  void createPlan_returnsOk() {
    FulfillmentPlanResponse response =
        new FulfillmentPlanResponse(
            "PLAN-12345678",
            "CREATED",
            new BigDecimal("9.99"),
            LocalDate.now().plusDays(5),
            List.of(
                new FulfillmentPlanResponse.FulfillmentLineItem(
                    1001L, "DELIVERY", "WAREHOUSE-001")));
    when(fulfillmentService.createPlan(any(), any(FulfillmentPlanRequest.class)))
        .thenReturn(Mono.just(response));

    webTestClient
        .post()
        .uri("/fulfillments/plan")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(
            new FulfillmentPlanRequest(
                "cart-123", FulfillmentType.DELIVERY, List.of(1001L), "12345"))
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.planId")
        .isEqualTo("PLAN-12345678")
        .jsonPath("$.status")
        .isEqualTo("CREATED")
        .jsonPath("$.lineItems[0].sku")
        .isEqualTo(1001);
  }

  @Test
  void createReservation_returnsOk() {
    ReservationResponse response =
        new ReservationResponse("RES-12345678", "PLAN-12345678", "RESERVED", null);
    when(fulfillmentService.createReservation(any(), any(ReservationRequest.class)))
        .thenReturn(Mono.just(response));

    webTestClient
        .post()
        .uri("/fulfillments/reserve")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(new ReservationRequest("PLAN-12345678", "cart-123", 30))
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.reservationId")
        .isEqualTo("RES-12345678")
        .jsonPath("$.planId")
        .isEqualTo("PLAN-12345678")
        .jsonPath("$.status")
        .isEqualTo("RESERVED");
  }
}
