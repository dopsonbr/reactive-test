package org.example.fulfillment.controller;

import org.example.fulfillment.dto.ShippingOptionsResponse;
import org.example.fulfillment.service.FulfillmentService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/** Controller for shipping options operations. */
@RestController
@RequestMapping("/shipping")
public class ShippingController {

  private final FulfillmentService fulfillmentService;

  public ShippingController(FulfillmentService fulfillmentService) {
    this.fulfillmentService = fulfillmentService;
  }

  @GetMapping("/options")
  public Mono<ShippingOptionsResponse> getShippingOptions(
      @RequestParam(defaultValue = "00000") String zipCode) {
    return Mono.deferContextual(ctx -> fulfillmentService.getShippingOptions(ctx, zipCode));
  }
}
