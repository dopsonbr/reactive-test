package org.example.fulfillment.controller;

import java.math.BigDecimal;
import java.util.List;
import org.example.model.fulfillment.FulfillmentType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/**
 * Minimal placeholder controller for fulfillment-service. Complex B2B/B2C omnichannel fulfillment
 * model (delivery, pickup, installation, haul-away, scheduling) to be designed in a future feature
 * plan.
 */
@RestController
@RequestMapping("/fulfillments")
public class FulfillmentController {

    /**
     * Calculate fulfillment cost.
     *
     * @param request the fulfillment cost request
     * @return the calculated cost
     */
    @PostMapping("/calculate")
    public Mono<FulfillmentCostResponse> calculateCost(
            @RequestBody FulfillmentCostRequest request) {
        // Stubbed costs based on fulfillment type
        BigDecimal cost =
                switch (request.type()) {
                    case DELIVERY -> new BigDecimal("9.99");
                    case PICKUP -> BigDecimal.ZERO;
                    case INSTALLATION -> new BigDecimal("49.99");
                };

        return Mono.just(new FulfillmentCostResponse(cost.toString()));
    }

    /** Request for calculating fulfillment cost. */
    public record FulfillmentCostRequest(FulfillmentType type, List<Long> skus) {}

    /** Response containing the calculated fulfillment cost. */
    public record FulfillmentCostResponse(String cost) {}
}
