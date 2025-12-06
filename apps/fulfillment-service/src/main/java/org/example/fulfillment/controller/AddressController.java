package org.example.fulfillment.controller;

import org.example.fulfillment.dto.AddressValidationRequest;
import org.example.fulfillment.dto.AddressValidationResponse;
import org.example.fulfillment.service.FulfillmentService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/** Controller for address validation operations. */
@RestController
@RequestMapping("/address")
public class AddressController {

  private final FulfillmentService fulfillmentService;

  public AddressController(FulfillmentService fulfillmentService) {
    this.fulfillmentService = fulfillmentService;
  }

  @PostMapping("/validate")
  public Mono<AddressValidationResponse> validateAddress(
      @RequestBody AddressValidationRequest request) {
    return Mono.deferContextual(ctx -> fulfillmentService.validateAddress(ctx, request));
  }
}
