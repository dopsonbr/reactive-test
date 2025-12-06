package org.example.discount.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.example.discount.controller.dto.CartItem;
import org.example.discount.controller.dto.PricingRequest;
import org.example.discount.controller.dto.ShippingOption;
import org.example.discount.domain.LoyaltyInfo;
import org.example.discount.domain.LoyaltyInfo.BenefitType;
import org.example.discount.domain.UserContext;
import org.example.discount.repository.DiscountRepository;
import org.example.discount.repository.MarkdownRepository;
import org.example.discount.repository.customer.CustomerRepository;
import org.example.discount.repository.user.UserRepository;
import org.example.model.discount.AppliedPromotion;
import org.example.model.discount.Discount;
import org.example.model.discount.DiscountScope;
import org.example.model.discount.DiscountType;
import org.example.model.discount.ItemPricing;
import org.example.model.discount.LoyaltySummary;
import org.example.model.discount.Markdown;
import org.example.model.discount.PricingResult;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Service for calculating best price for a cart. */
@Service
public class PricingService {

  private static final BigDecimal STANDARD_SHIPPING = BigDecimal.valueOf(9.99);
  private static final BigDecimal EXPRESS_SHIPPING = BigDecimal.valueOf(19.99);

  private final DiscountRepository discountRepository;
  private final MarkdownRepository markdownRepository;
  private final CustomerRepository customerRepository;
  private final UserRepository userRepository;

  public PricingService(
      DiscountRepository discountRepository,
      MarkdownRepository markdownRepository,
      CustomerRepository customerRepository,
      UserRepository userRepository) {
    this.discountRepository = discountRepository;
    this.markdownRepository = markdownRepository;
    this.customerRepository = customerRepository;
    this.userRepository = userRepository;
  }

  /**
   * Calculate the best price for a cart.
   *
   * @param request the pricing request
   * @return the pricing result with all discounts applied
   */
  public Mono<PricingResult> calculateBestPrice(PricingRequest request) {
    return Mono.zip(
            getCustomerLoyalty(request.customerId()),
            getUserContext(request.userId()),
            getApplicableDiscounts(request),
            getActiveMarkdowns(request.cartId()))
        .flatMap(
            tuple -> {
              LoyaltyInfo loyalty = tuple.getT1();
              UserContext user = tuple.getT2();
              List<Discount> discounts = tuple.getT3();
              List<Markdown> markdowns = tuple.getT4();

              return computeOptimalPricing(request, loyalty, user, discounts, markdowns);
            });
  }

  private Mono<LoyaltyInfo> getCustomerLoyalty(String customerId) {
    if (customerId == null || customerId.isEmpty()) {
      return Mono.just(new LoyaltyInfo("NONE", 0L, List.of()));
    }
    return customerRepository
        .getCustomerLoyalty(customerId)
        .defaultIfEmpty(new LoyaltyInfo("NONE", 0L, List.of()));
  }

  private Mono<UserContext> getUserContext(String userId) {
    if (userId == null || userId.isEmpty()) {
      return Mono.just(UserContext.anonymous());
    }
    return userRepository.getUser(userId).defaultIfEmpty(UserContext.anonymous());
  }

  private Mono<List<Discount>> getApplicableDiscounts(PricingRequest request) {
    // Get auto-apply discounts + validate promo codes
    Flux<Discount> autoApply = discountRepository.findAutoApplyByStore(request.storeNumber());

    List<String> promoCodes = request.promoCodes() != null ? request.promoCodes() : List.of();
    Flux<Discount> promoDiscounts =
        Flux.fromIterable(promoCodes)
            .flatMap(
                code ->
                    discountRepository
                        .findByCode(code)
                        .filter(Discount::isValid)
                        .filter(d -> d.appliesTo(request.storeNumber())));

    return Flux.merge(autoApply, promoDiscounts).distinct(Discount::discountId).collectList();
  }

  private Mono<List<Markdown>> getActiveMarkdowns(String cartId) {
    if (cartId == null || cartId.isEmpty()) {
      return Mono.just(List.of());
    }
    return markdownRepository.findActiveByCart(cartId).collectList();
  }

  private Mono<PricingResult> computeOptimalPricing(
      PricingRequest request,
      LoyaltyInfo loyalty,
      UserContext user,
      List<Discount> discounts,
      List<Markdown> markdowns) {

    BigDecimal subtotal = calculateSubtotal(request.items());
    List<ItemPricing> itemPricings = buildItemPricings(request.items());
    List<AppliedPromotion> appliedPromotions = new ArrayList<>();
    BigDecimal totalSavings = BigDecimal.ZERO;

    // 1. Apply loyalty tier discount (if applicable)
    BigDecimal loyaltyDiscount = applyLoyaltyDiscount(loyalty, subtotal);
    if (loyaltyDiscount.compareTo(BigDecimal.ZERO) > 0) {
      totalSavings = totalSavings.add(loyaltyDiscount);
      appliedPromotions.add(
          new AppliedPromotion(
              "loyalty-tier",
              "LOYALTY",
              loyalty.tier() + " tier discount",
              loyaltyDiscount,
              DiscountScope.CART));
    }

    // 2. Apply best discount combination
    BigDecimal promoSavings = applyBestDiscounts(discounts, subtotal, appliedPromotions);
    totalSavings = totalSavings.add(promoSavings);

    // 3. Apply employee markdowns (if user is employee)
    if (user.isEmployee() && !markdowns.isEmpty()) {
      BigDecimal markdownSavings = applyMarkdowns(markdowns, subtotal, appliedPromotions);
      totalSavings = totalSavings.add(markdownSavings);
    }

    // 4. Calculate shipping
    BigDecimal shippingCost = calculateShipping(request.shipping(), subtotal);
    BigDecimal shippingDiscount = calculateShippingDiscount(discounts, loyalty, shippingCost);

    if (shippingDiscount.compareTo(BigDecimal.ZERO) > 0) {
      appliedPromotions.add(
          new AppliedPromotion(
              "shipping-discount",
              loyalty.hasBenefit(BenefitType.FREE_SHIPPING) ? "LOYALTY" : "PROMO_CODE",
              "Free shipping",
              shippingDiscount,
              DiscountScope.SHIPPING));
    }

    // 5. Build result
    BigDecimal finalSubtotal = subtotal.subtract(totalSavings).max(BigDecimal.ZERO);
    LoyaltySummary loyaltySummary = buildLoyaltySummary(loyalty, finalSubtotal);

    return Mono.just(
        new PricingResult(
            request.cartId(),
            subtotal,
            finalSubtotal,
            totalSavings,
            shippingCost,
            shippingDiscount,
            itemPricings,
            appliedPromotions,
            loyaltySummary,
            Instant.now()));
  }

  private BigDecimal calculateSubtotal(List<CartItem> items) {
    if (items == null || items.isEmpty()) {
      return BigDecimal.ZERO;
    }
    return items.stream()
        .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private List<ItemPricing> buildItemPricings(List<CartItem> items) {
    if (items == null || items.isEmpty()) {
      return List.of();
    }
    return items.stream()
        .map(
            item -> {
              BigDecimal total = item.unitPrice().multiply(BigDecimal.valueOf(item.quantity()));
              return new ItemPricing(
                  item.sku(),
                  item.quantity(),
                  item.unitPrice(),
                  total,
                  total,
                  BigDecimal.ZERO,
                  List.of());
            })
        .toList();
  }

  private BigDecimal applyLoyaltyDiscount(LoyaltyInfo loyalty, BigDecimal subtotal) {
    if (loyalty == null) {
      return BigDecimal.ZERO;
    }

    return loyalty
        .getBenefit(BenefitType.PERCENTAGE_DISCOUNT)
        .map(
            benefit ->
                subtotal
                    .multiply(benefit.value())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP))
        .orElse(BigDecimal.ZERO);
  }

  private BigDecimal applyBestDiscounts(
      List<Discount> discounts, BigDecimal subtotal, List<AppliedPromotion> applied) {

    // Separate stackable and non-stackable
    List<Discount> stackable =
        discounts.stream()
            .filter(Discount::stackable)
            .filter(d -> d.scope() == DiscountScope.CART)
            .toList();
    List<Discount> nonStackable =
        discounts.stream()
            .filter(d -> !d.stackable())
            .filter(d -> d.scope() == DiscountScope.CART)
            .toList();

    // Calculate stackable total
    BigDecimal stackableSavings =
        stackable.stream()
            .map(d -> calculateDiscountValue(d, subtotal))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    // Find best non-stackable
    BigDecimal bestNonStackable =
        nonStackable.stream()
            .map(d -> calculateDiscountValue(d, subtotal))
            .max(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO);

    // Use whichever is better
    if (stackableSavings.compareTo(bestNonStackable) >= 0 && !stackable.isEmpty()) {
      stackable.forEach(
          d ->
              applied.add(
                  new AppliedPromotion(
                      d.discountId(),
                      d.autoApply() ? "AUTO_APPLY" : "PROMO_CODE",
                      d.description(),
                      calculateDiscountValue(d, subtotal),
                      d.scope())));
      return stackableSavings;
    } else if (bestNonStackable.compareTo(BigDecimal.ZERO) > 0) {
      nonStackable.stream()
          .filter(d -> calculateDiscountValue(d, subtotal).equals(bestNonStackable))
          .findFirst()
          .ifPresent(
              d ->
                  applied.add(
                      new AppliedPromotion(
                          d.discountId(),
                          d.autoApply() ? "AUTO_APPLY" : "PROMO_CODE",
                          d.description(),
                          bestNonStackable,
                          d.scope())));
      return bestNonStackable;
    }

    return BigDecimal.ZERO;
  }

  private BigDecimal calculateDiscountValue(Discount discount, BigDecimal subtotal) {
    if (subtotal.compareTo(discount.minimumPurchase()) < 0) {
      return BigDecimal.ZERO;
    }
    return switch (discount.type()) {
      case PERCENTAGE ->
          subtotal
              .multiply(discount.value())
              .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
      case FIXED_AMOUNT -> discount.value().min(subtotal);
      case FREE_SHIPPING, BUY_X_GET_Y -> BigDecimal.ZERO;
    };
  }

  private BigDecimal applyMarkdowns(
      List<Markdown> markdowns, BigDecimal subtotal, List<AppliedPromotion> applied) {
    BigDecimal totalSavings = BigDecimal.ZERO;

    for (Markdown markdown : markdowns) {
      BigDecimal savings = calculateMarkdownValue(markdown, subtotal);
      if (savings.compareTo(BigDecimal.ZERO) > 0) {
        totalSavings = totalSavings.add(savings);
        applied.add(
            new AppliedPromotion(
                markdown.markdownId(),
                "MARKDOWN",
                "Employee markdown: " + markdown.reason(),
                savings,
                markdown.isCartLevel() ? DiscountScope.CART : DiscountScope.ITEM));
      }
    }

    return totalSavings;
  }

  private BigDecimal calculateMarkdownValue(Markdown markdown, BigDecimal subtotal) {
    return switch (markdown.type()) {
      case PERCENTAGE ->
          subtotal
              .multiply(markdown.value())
              .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
      case FIXED_AMOUNT -> markdown.value().min(subtotal);
      case OVERRIDE_PRICE -> subtotal.subtract(markdown.value()).max(BigDecimal.ZERO);
    };
  }

  private BigDecimal calculateShipping(ShippingOption option, BigDecimal subtotal) {
    if (option == null || option == ShippingOption.PICKUP) {
      return BigDecimal.ZERO;
    }
    return switch (option) {
      case STANDARD -> STANDARD_SHIPPING;
      case EXPRESS -> EXPRESS_SHIPPING;
      case PICKUP -> BigDecimal.ZERO;
    };
  }

  private BigDecimal calculateShippingDiscount(
      List<Discount> discounts, LoyaltyInfo loyalty, BigDecimal shippingCost) {
    if (shippingCost.compareTo(BigDecimal.ZERO) == 0) {
      return BigDecimal.ZERO;
    }

    // Check loyalty free shipping benefit
    if (loyalty != null && loyalty.hasBenefit(BenefitType.FREE_SHIPPING)) {
      return shippingCost;
    }

    // Check for free shipping discount
    boolean hasFreeShipping =
        discounts.stream()
            .filter(d -> d.scope() == DiscountScope.SHIPPING)
            .filter(d -> d.type() == DiscountType.FREE_SHIPPING)
            .anyMatch(Discount::isValid);

    return hasFreeShipping ? shippingCost : BigDecimal.ZERO;
  }

  private LoyaltySummary buildLoyaltySummary(LoyaltyInfo loyalty, BigDecimal orderTotal) {
    if (loyalty == null || "NONE".equals(loyalty.tier())) {
      return null;
    }

    // Calculate points earned (1 point per dollar)
    long pointsEarned = orderTotal.setScale(0, RoundingMode.DOWN).longValue();

    // Determine points to next tier
    long pointsToNextTier =
        switch (loyalty.tier()) {
          case "BRONZE" -> 2500 - loyalty.pointsBalance();
          case "SILVER" -> 5000 - loyalty.pointsBalance();
          case "GOLD" -> 10000 - loyalty.pointsBalance();
          case "PLATINUM" -> 25000 - loyalty.pointsBalance();
          default -> 0;
        };

    List<String> appliedBenefits =
        loyalty.benefits() != null
            ? loyalty.benefits().stream().map(b -> b.description()).toList()
            : List.of();

    return new LoyaltySummary(
        loyalty.tier(),
        pointsEarned,
        loyalty.pointsBalance(),
        Math.max(0, pointsToNextTier),
        appliedBenefits);
  }
}
