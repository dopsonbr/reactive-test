package org.example.fulfillment.controller;

import org.example.fulfillment.dto.*;
import org.example.fulfillment.service.FulfillmentService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/** Controller for fulfillment operations including cost calculation, plans, and reservations. */
@RestController
@RequestMapping("/fulfillments")
public class FulfillmentController {

  private final FulfillmentService fulfillmentService;

  public FulfillmentController(FulfillmentService fulfillmentService) {
    this.fulfillmentService = fulfillmentService;
  }

  @PostMapping("/calculate")
  public Mono<FulfillmentCostResponse> calculateCost(@RequestBody FulfillmentCostRequest request) {
    return Mono.deferContextual(ctx -> fulfillmentService.calculateCost(ctx, request));
  }

  @PostMapping("/plan")
  public Mono<FulfillmentPlanResponse> createPlan(@RequestBody FulfillmentPlanRequest request) {
    return Mono.deferContextual(ctx -> fulfillmentService.createPlan(ctx, request));
  }

  @PostMapping("/reserve")
  public Mono<ReservationResponse> createReservation(@RequestBody ReservationRequest request) {
    return Mono.deferContextual(ctx -> fulfillmentService.createReservation(ctx, request));
  }
}
