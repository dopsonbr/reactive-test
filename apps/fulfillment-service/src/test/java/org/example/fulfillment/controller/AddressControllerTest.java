package org.example.fulfillment.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import org.example.fulfillment.dto.AddressValidationRequest;
import org.example.fulfillment.dto.AddressValidationResponse;
import org.example.fulfillment.service.FulfillmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webflux.test.autoconfigure.WebFluxTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

@WebFluxTest(AddressController.class)
@Import(TestSecurityConfig.class)
class AddressControllerTest {

  @Autowired private WebTestClient webTestClient;

  @MockitoBean private FulfillmentService fulfillmentService;

  @Test
  void validateAddress_returnsOk() {
    AddressValidationResponse response =
        new AddressValidationResponse(
            true, true, "123 Main St, Springfield, IL 62701", "Address validated successfully");
    when(fulfillmentService.validateAddress(any(), any(AddressValidationRequest.class)))
        .thenReturn(Mono.just(response));

    webTestClient
        .post()
        .uri("/address/validate")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(
            new AddressValidationRequest("123 Main St", null, "Springfield", "IL", "62701", "US"))
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.valid")
        .isEqualTo(true)
        .jsonPath("$.deliverable")
        .isEqualTo(true)
        .jsonPath("$.normalizedAddress")
        .isEqualTo("123 Main St, Springfield, IL 62701")
        .jsonPath("$.validationMessage")
        .isEqualTo("Address validated successfully");
  }
}
