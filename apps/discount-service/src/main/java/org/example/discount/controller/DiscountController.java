package org.example.discount.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import org.example.model.discount.AppliedDiscount;
import org.example.model.discount.Discount;
import org.example.model.discount.DiscountType;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

/** Placeholder controller for discount-service. Returns stubbed discounts for testing purposes. */
@RestController
@RequestMapping("/discounts")
public class DiscountController {

    // Stubbed discount codes
    private static final Map<String, Discount> STUBBED_DISCOUNTS =
            Map.of(
                    "SAVE10",
                            new Discount(
                                    "disc-001",
                                    "SAVE10",
                                    DiscountType.PERCENTAGE,
                                    BigDecimal.valueOf(10),
                                    "10% off your order",
                                    Instant.now().plus(365, ChronoUnit.DAYS)),
                    "FLAT5",
                            new Discount(
                                    "disc-002",
                                    "FLAT5",
                                    DiscountType.FIXED_AMOUNT,
                                    BigDecimal.valueOf(5),
                                    "$5 off your order",
                                    Instant.now().plus(365, ChronoUnit.DAYS)),
                    "FREESHIP",
                            new Discount(
                                    "disc-003",
                                    "FREESHIP",
                                    DiscountType.FREE_SHIPPING,
                                    BigDecimal.ZERO,
                                    "Free shipping on your order",
                                    Instant.now().plus(365, ChronoUnit.DAYS)));

    /**
     * Validate a discount code.
     *
     * @param code the discount code to validate
     * @return the discount if valid
     */
    @GetMapping("/validate")
    public Mono<Discount> validateDiscount(@RequestParam String code) {
        Discount discount = STUBBED_DISCOUNTS.get(code.toUpperCase());
        if (discount == null) {
            return Mono.error(
                    new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Invalid discount code: " + code));
        }
        return Mono.just(discount);
    }

    /**
     * Calculate discount for a cart.
     *
     * @param request the calculation request
     * @return the applied discount with calculated savings
     */
    @PostMapping("/calculate")
    public Mono<AppliedDiscount> calculateDiscount(@RequestBody CalculateDiscountRequest request) {
        Discount discount = STUBBED_DISCOUNTS.get(request.code().toUpperCase());
        if (discount == null) {
            return Mono.error(
                    new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Invalid discount code: " + request.code()));
        }

        BigDecimal subtotal = new BigDecimal(request.subtotal());
        BigDecimal savings = calculateSavings(discount, subtotal);

        return Mono.just(AppliedDiscount.fromDiscount(discount, savings, request.skus()));
    }

    private BigDecimal calculateSavings(Discount discount, BigDecimal subtotal) {
        return switch (discount.type()) {
            case PERCENTAGE ->
                    subtotal.multiply(discount.value())
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            case FIXED_AMOUNT -> discount.value().min(subtotal);
            case FREE_SHIPPING -> BigDecimal.ZERO; // Shipping handled separately
            case BUY_X_GET_Y -> BigDecimal.ZERO; // Would need item info to calculate
        };
    }

    /** Request for calculating discount. */
    public record CalculateDiscountRequest(String code, String subtotal, List<Long> skus) {}
}
