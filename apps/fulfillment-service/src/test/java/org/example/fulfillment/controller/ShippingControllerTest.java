package org.example.fulfillment.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import org.example.fulfillment.dto.ShippingOption;
import org.example.fulfillment.dto.ShippingOptionsResponse;
import org.example.fulfillment.service.FulfillmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webflux.test.autoconfigure.WebFluxTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

@WebFluxTest(ShippingController.class)
@Import(TestSecurityConfig.class)
class ShippingControllerTest {

  @Autowired private WebTestClient webTestClient;

  @MockitoBean private FulfillmentService fulfillmentService;

  @Test
  void getShippingOptions_returnsOk() {
    ShippingOptionsResponse response =
        new ShippingOptionsResponse(
            List.of(
                new ShippingOption(
                    "STANDARD",
                    "Standard Shipping",
                    "5-7 business days",
                    new BigDecimal("5.99"),
                    5,
                    7),
                new ShippingOption(
                    "EXPRESS",
                    "Express Shipping",
                    "2-3 business days",
                    new BigDecimal("12.99"),
                    2,
                    3)));
    when(fulfillmentService.getShippingOptions(any(), eq("12345"))).thenReturn(Mono.just(response));

    webTestClient
        .get()
        .uri(
            uriBuilder ->
                uriBuilder.path("/shipping/options").queryParam("zipCode", "12345").build())
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.options.length()")
        .isEqualTo(2)
        .jsonPath("$.options[0].optionId")
        .isEqualTo("STANDARD")
        .jsonPath("$.options[0].cost")
        .isEqualTo(5.99)
        .jsonPath("$.options[1].optionId")
        .isEqualTo("EXPRESS");
  }

  @Test
  void getShippingOptions_withDefaultZipCode_returnsOk() {
    ShippingOptionsResponse response =
        new ShippingOptionsResponse(
            List.of(
                new ShippingOption(
                    "STANDARD",
                    "Standard Shipping",
                    "5-7 business days",
                    new BigDecimal("5.99"),
                    5,
                    7)));
    when(fulfillmentService.getShippingOptions(any(), eq("00000"))).thenReturn(Mono.just(response));

    webTestClient
        .get()
        .uri("/shipping/options")
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.options.length()")
        .isEqualTo(1);
  }
}
