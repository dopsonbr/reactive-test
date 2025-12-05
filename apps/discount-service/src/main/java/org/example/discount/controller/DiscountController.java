package org.example.discount.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.example.discount.exception.InvalidDiscountException;
import org.example.discount.service.DiscountService;
import org.example.model.discount.AppliedDiscount;
import org.example.model.discount.Discount;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Controller for discount operations. */
@RestController
@RequestMapping("/discounts")
public class DiscountController {

  private final DiscountService discountService;

  public DiscountController(DiscountService discountService) {
    this.discountService = discountService;
  }

  /**
   * Validate a discount code for a store.
   *
   * @param code the discount code to validate
   * @param storeNumber the store number (default 1)
   * @return the discount if valid
   */
  @GetMapping("/validate")
  public Mono<Discount> validateDiscount(
      @RequestParam String code, @RequestParam(defaultValue = "1") int storeNumber) {
    return discountService
        .validateCode(code, storeNumber)
        .onErrorResume(
            InvalidDiscountException.class,
            e ->
                Mono.error(
                    new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage())));
  }

  /**
   * Get all active discounts for a store.
   *
   * @param storeNumber the store number (default 1)
   * @return stream of active discounts
   */
  @GetMapping("/active")
  public Flux<Discount> getActiveDiscounts(@RequestParam(defaultValue = "1") int storeNumber) {
    return discountService.getActiveDiscounts(storeNumber);
  }

  /**
   * Calculate discount for a cart.
   *
   * @param request the calculation request
   * @return the applied discount with calculated savings
   */
  @PostMapping("/calculate")
  public Mono<AppliedDiscount> calculateDiscount(@RequestBody CalculateDiscountRequest request) {
    int storeNumber = request.storeNumber() != null ? request.storeNumber() : 1;

    return discountService
        .validateCode(request.code(), storeNumber)
        .map(
            discount -> {
              BigDecimal subtotal = new BigDecimal(request.subtotal());
              BigDecimal savings = calculateSavings(discount, subtotal);
              return AppliedDiscount.fromDiscount(discount, savings, request.skus());
            })
        .onErrorResume(
            InvalidDiscountException.class,
            e ->
                Mono.error(
                    new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage())));
  }

  private BigDecimal calculateSavings(Discount discount, BigDecimal subtotal) {
    return switch (discount.type()) {
      case PERCENTAGE ->
          subtotal
              .multiply(discount.value())
              .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
      case FIXED_AMOUNT -> discount.value().min(subtotal);
      case FREE_SHIPPING -> BigDecimal.ZERO; // Shipping handled separately
      case BUY_X_GET_Y -> BigDecimal.ZERO; // Would need item info to calculate
    };
  }

  /** Request for calculating discount. */
  public record CalculateDiscountRequest(
      String code, String subtotal, List<Long> skus, Integer storeNumber) {}
}
