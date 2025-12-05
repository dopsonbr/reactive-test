package org.example.discount.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import org.example.model.discount.Discount;
import org.example.model.discount.DiscountScope;
import org.example.model.discount.DiscountType;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** In-memory implementation of DiscountRepository with mock discount data. */
@Repository
public class InMemoryDiscountRepository implements DiscountRepository {

    private static final Map<String, Discount> DISCOUNTS =
            Map.of(
                    "SAVE10",
                    new Discount(
                            "disc-001",
                            "SAVE10",
                            DiscountType.PERCENTAGE,
                            BigDecimal.valueOf(10),
                            "10% off your order",
                            Instant.now().plus(365, ChronoUnit.DAYS),
                            DiscountScope.CART,
                            true,
                            BigDecimal.ZERO,
                            List.of(),
                            List.of(),
                            false),
                    "SAVE20",
                    new Discount(
                            "disc-002",
                            "SAVE20",
                            DiscountType.PERCENTAGE,
                            BigDecimal.valueOf(20),
                            "20% off your order",
                            Instant.now().plus(365, ChronoUnit.DAYS),
                            DiscountScope.CART,
                            false,
                            BigDecimal.valueOf(50),
                            List.of(),
                            List.of(),
                            false),
                    "FLAT5",
                    new Discount(
                            "disc-003",
                            "FLAT5",
                            DiscountType.FIXED_AMOUNT,
                            BigDecimal.valueOf(5),
                            "$5 off your order",
                            Instant.now().plus(365, ChronoUnit.DAYS),
                            DiscountScope.CART,
                            true,
                            BigDecimal.ZERO,
                            List.of(),
                            List.of(),
                            false),
                    "FREESHIP",
                    new Discount(
                            "disc-004",
                            "FREESHIP",
                            DiscountType.FREE_SHIPPING,
                            BigDecimal.ZERO,
                            "Free shipping",
                            Instant.now().plus(365, ChronoUnit.DAYS),
                            DiscountScope.SHIPPING,
                            true,
                            BigDecimal.valueOf(25),
                            List.of(),
                            List.of(),
                            false),
                    "SUMMER15",
                    new Discount(
                            "disc-005",
                            "SUMMER15",
                            DiscountType.PERCENTAGE,
                            BigDecimal.valueOf(15),
                            "Summer sale 15% off",
                            Instant.now().plus(90, ChronoUnit.DAYS),
                            DiscountScope.CART,
                            false,
                            BigDecimal.ZERO,
                            List.of(),
                            List.of(),
                            true),
                    "LOYALTY5",
                    new Discount(
                            "disc-006",
                            "LOYALTY5",
                            DiscountType.PERCENTAGE,
                            BigDecimal.valueOf(5),
                            "Loyalty member 5% off",
                            Instant.now().plus(365, ChronoUnit.DAYS),
                            DiscountScope.CART,
                            true,
                            BigDecimal.ZERO,
                            List.of(),
                            List.of(),
                            true));

    @Override
    public Mono<Discount> findById(String discountId) {
        return Mono.justOrEmpty(
                DISCOUNTS.values().stream()
                        .filter(d -> d.discountId().equals(discountId))
                        .findFirst());
    }

    @Override
    public Mono<Discount> findByCode(String code) {
        return Mono.justOrEmpty(DISCOUNTS.get(code.toUpperCase()));
    }

    @Override
    public Flux<Discount> findActiveByStore(int storeNumber) {
        return Flux.fromIterable(DISCOUNTS.values())
                .filter(Discount::isValid)
                .filter(d -> d.appliesTo(storeNumber));
    }

    @Override
    public Flux<Discount> findAutoApplyByStore(int storeNumber) {
        return findActiveByStore(storeNumber).filter(Discount::autoApply);
    }
}
