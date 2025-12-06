package org.example.discount.controller;

import org.example.discount.controller.dto.PricingRequest;
import org.example.discount.service.PricingService;
import org.example.discount.validation.DiscountRequestValidator;
import org.example.model.discount.PricingResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/** Controller for pricing calculation. */
@RestController
@RequestMapping("/pricing")
public class PricingController {

  private final PricingService pricingService;
  private final DiscountRequestValidator validator;

  public PricingController(PricingService pricingService, DiscountRequestValidator validator) {
    this.pricingService = pricingService;
    this.validator = validator;
  }

  /**
   * Calculate the best price for a cart.
   *
   * @param request the pricing request with cart items, promo codes, and customer info
   * @return the pricing result with all discounts and savings
   */
  @PostMapping("/calculate")
  public Mono<PricingResult> calculateBestPrice(@RequestBody PricingRequest request) {
    return validator
        .validatePricingRequest(request)
        .then(pricingService.calculateBestPrice(request));
  }
}
