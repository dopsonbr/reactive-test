package org.example.checkout.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.example.checkout.client.CartServiceClient;
import org.example.checkout.client.CartServiceClient.CartDetails;
import org.example.checkout.client.DiscountServiceClient;
import org.example.checkout.client.DiscountServiceClient.DiscountRequest;
import org.example.checkout.client.DiscountServiceClient.DiscountRequestItem;
import org.example.checkout.client.FulfillmentServiceClient;
import org.example.checkout.client.FulfillmentServiceClient.FulfillmentItem;
import org.example.checkout.client.FulfillmentServiceClient.ReservationRequest;
import org.example.checkout.client.PaymentGatewayClient;
import org.example.checkout.client.PaymentGatewayClient.PaymentDetails;
import org.example.checkout.client.PaymentGatewayClient.PaymentRequest;
import org.example.checkout.dto.CheckoutSummaryResponse;
import org.example.checkout.dto.CompleteCheckoutRequest;
import org.example.checkout.dto.InitiateCheckoutRequest;
import org.example.checkout.dto.OrderResponse;
import org.example.model.order.AppliedDiscount;
import org.example.model.order.CustomerSnapshot;
import org.example.model.order.FulfillmentDetails;
import org.example.model.order.FulfillmentType;
import org.example.model.order.Order;
import org.example.model.order.OrderLineItem;
import org.example.model.order.OrderStatus;
import org.example.model.order.PaymentStatus;
import org.example.checkout.repository.OrderRepository;
import org.example.checkout.validation.CartValidator;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Service for managing checkout operations. */
@Service
public class CheckoutService {

  private static final String LOGGER_NAME = "checkoutservice";
  private static final int SESSION_EXPIRY_MINUTES = 15;

  private final OrderRepository orderRepository;
  private final CartServiceClient cartServiceClient;
  private final DiscountServiceClient discountServiceClient;
  private final FulfillmentServiceClient fulfillmentServiceClient;
  private final PaymentGatewayClient paymentGatewayClient;
  private final CartValidator cartValidator;
  private final StructuredLogger structuredLogger;

  // In-memory checkout session store (would use Redis in production)
  private final ConcurrentHashMap<String, CheckoutSession> checkoutSessions =
      new ConcurrentHashMap<>();

  public CheckoutService(
      OrderRepository orderRepository,
      CartServiceClient cartServiceClient,
      DiscountServiceClient discountServiceClient,
      FulfillmentServiceClient fulfillmentServiceClient,
      PaymentGatewayClient paymentGatewayClient,
      CartValidator cartValidator,
      StructuredLogger structuredLogger) {
    this.orderRepository = orderRepository;
    this.cartServiceClient = cartServiceClient;
    this.discountServiceClient = discountServiceClient;
    this.fulfillmentServiceClient = fulfillmentServiceClient;
    this.paymentGatewayClient = paymentGatewayClient;
    this.cartValidator = cartValidator;
    this.structuredLogger = structuredLogger;
  }

  /**
   * Initiate checkout process. Validates cart, calculates discounts, creates fulfillment
   * reservation.
   *
   * @param request the initiate checkout request
   * @param storeNumber the store number
   * @return checkout summary for payment
   */
  public Mono<CheckoutSummaryResponse> initiateCheckout(
      InitiateCheckoutRequest request, int storeNumber) {
    return Mono.deferContextual(
        ctx -> {
          RequestMetadata metadata = ctx.getOrDefault(ContextKeys.METADATA, null);
          String orderNumber =
              metadata != null ? metadata.orderNumber() : UUID.randomUUID().toString();

          structuredLogger.logMessage(
              ctx,
              LOGGER_NAME,
              String.format(
                  "Initiating checkout for cart %s, store %d", request.cartId(), storeNumber));

          // Step 1: Fetch and validate cart
          return cartServiceClient
              .getCart(request.cartId(), storeNumber)
              .flatMap(
                  cart -> cartValidator.validateForCheckout(cart, storeNumber).thenReturn(cart))
              // Step 2: Validate and calculate discounts
              .flatMap(cart -> validateDiscounts(cart).thenReturn(cart))
              // Step 3: Create fulfillment reservation
              .flatMap(
                  cart ->
                      createReservation(cart, request, storeNumber)
                          .map(reservationId -> new CartWithReservation(cart, reservationId)))
              // Step 4: Build checkout summary
              .flatMap(
                  cartWithRes ->
                      buildCheckoutSummary(
                          cartWithRes.cart(),
                          cartWithRes.reservationId(),
                          request,
                          storeNumber,
                          orderNumber));
        });
  }

  /**
   * Complete checkout with payment.
   *
   * @param request the complete checkout request
   * @param storeNumber the store number
   * @return the completed order
   */
  public Mono<OrderResponse> completeCheckout(CompleteCheckoutRequest request, int storeNumber) {
    return Mono.deferContextual(
        ctx -> {
          RequestMetadata metadata = ctx.getOrDefault(ContextKeys.METADATA, null);
          String userId = metadata != null ? metadata.userId() : "";
          String sessionId = metadata != null ? metadata.sessionId() : "";

          structuredLogger.logMessage(
              ctx,
              LOGGER_NAME,
              String.format(
                  "Completing checkout for session %s, store %d",
                  request.checkoutSessionId(), storeNumber));

          // Step 1: Retrieve and validate checkout session
          return getCheckoutSession(request.checkoutSessionId())
              .flatMap(session -> validateSession(session, storeNumber))
              // Step 2: Process payment
              .flatMap(
                  session ->
                      processPayment(request, session, storeNumber)
                          .map(paymentRef -> new SessionWithPayment(session, paymentRef)))
              // Step 3: Create and persist order
              .flatMap(
                  sessionWithPayment ->
                      createOrder(
                          sessionWithPayment.session(),
                          sessionWithPayment.paymentReference(),
                          request.paymentMethod(),
                          userId,
                          sessionId != null ? UUID.fromString(sessionId) : null))
              // Step 4: Mark cart as completed
              .flatMap(
                  order ->
                      markCartCompleted(order)
                          .thenReturn(order)
                          .onErrorResume(
                              e -> {
                                // Log error but don't fail - cart completion is best effort
                                structuredLogger.logMessage(
                                    ctx,
                                    LOGGER_NAME,
                                    "Failed to mark cart completed: " + e.getMessage());
                                return Mono.just(order);
                              }))
              // Step 5: Return order response
              .map(OrderResponse::fromOrder);
        });
  }

  /**
   * Get an order by ID.
   *
   * @param orderId the order ID
   * @return the order
   */
  public Mono<OrderResponse> getOrder(UUID orderId) {
    return orderRepository
        .findById(orderId)
        .map(OrderResponse::fromOrder)
        .switchIfEmpty(
            Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found")));
  }

  /**
   * List orders for a store.
   *
   * @param storeNumber the store number
   * @return list of orders
   */
  public Flux<OrderResponse> listOrdersByStore(int storeNumber) {
    return orderRepository.findByStoreNumber(storeNumber).map(OrderResponse::fromOrder);
  }

  // ==================== Helper Methods ====================

  private Mono<Void> validateDiscounts(CartDetails cart) {
    if (cart.discounts() == null || cart.discounts().isEmpty()) {
      return Mono.empty();
    }

    List<String> discountCodes =
        cart.discounts().stream()
            .map(CartServiceClient.CartDiscount::code)
            .collect(Collectors.toList());

    List<DiscountRequestItem> items =
        cart.products().stream()
            .map(item -> new DiscountRequestItem(item.sku(), item.quantity(), item.unitPrice()))
            .collect(Collectors.toList());

    DiscountRequest request =
        new DiscountRequest(
            cart.customerId(),
            cart.customer() != null ? cart.customer().loyaltyTier() : null,
            cart.totals().subtotal(),
            items,
            discountCodes);

    return discountServiceClient
        .validateAndCalculateDiscounts(request)
        .flatMap(
            response -> {
              if (!response.valid()
                  && response.invalidCodes() != null
                  && !response.invalidCodes().isEmpty()) {
                return Mono.error(
                    new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid discount codes: " + String.join(", ", response.invalidCodes())));
              }
              return Mono.empty();
            });
  }

  private Mono<UUID> createReservation(
      CartDetails cart, InitiateCheckoutRequest request, int storeNumber) {
    // For IMMEDIATE fulfillment (in-store self-checkout), skip reservation
    // since customer takes items immediately - no inventory hold needed
    if (request.fulfillmentType() == FulfillmentType.IMMEDIATE) {
      return Mono.just(UUID.randomUUID()); // Generate placeholder reservation ID
    }

    List<FulfillmentItem> items =
        cart.products().stream()
            .map(item -> new FulfillmentItem(item.sku(), item.quantity()))
            .collect(Collectors.toList());

    ReservationRequest reservationRequest =
        new ReservationRequest(
            storeNumber,
            request.fulfillmentType(),
            request.fulfillmentDate(),
            items,
            request.deliveryAddress(),
            request.instructions());

    return fulfillmentServiceClient
        .createReservation(reservationRequest)
        .flatMap(
            response -> {
              if (response.unavailableItems() != null && !response.unavailableItems().isEmpty()) {
                return Mono.error(
                    new ResponseStatusException(
                        HttpStatus.CONFLICT, "Some items are not available for fulfillment"));
              }
              return Mono.just(response.reservationId());
            });
  }

  private Mono<CheckoutSummaryResponse> buildCheckoutSummary(
      CartDetails cart,
      UUID reservationId,
      InitiateCheckoutRequest request,
      int storeNumber,
      String orderNumber) {
    String sessionId = UUID.randomUUID().toString();
    Instant expiresAt = Instant.now().plus(SESSION_EXPIRY_MINUTES, ChronoUnit.MINUTES);

    // Convert cart products to order line items
    List<OrderLineItem> lineItems =
        cart.products().stream()
            .map(
                item ->
                    OrderLineItem.create(
                        item.productId(),
                        String.valueOf(item.sku()),
                        item.name(),
                        item.quantity(),
                        item.unitPrice(),
                        BigDecimal.ZERO))
            .collect(Collectors.toList());

    // Convert discounts
    List<AppliedDiscount> appliedDiscounts =
        cart.discounts() != null
            ? cart.discounts().stream()
                .map(
                    d ->
                        new AppliedDiscount(
                            d.discountId(), d.code(), null, d.type(), d.appliedSavings()))
                .collect(Collectors.toList())
            : List.of();

    // Build customer snapshot
    CustomerSnapshot customerSnapshot =
        cart.customer() != null
            ? new CustomerSnapshot(
                cart.customer().customerId(),
                cart.customer().firstName(),
                cart.customer().lastName(),
                cart.customer().email(),
                cart.customer().phone(),
                cart.customer().loyaltyTier())
            : null;

    // Build fulfillment details
    FulfillmentDetails fulfillmentDetails =
        new FulfillmentDetails(
            request.fulfillmentType(),
            request.fulfillmentDate(),
            request.deliveryAddress(),
            null, // pickup location set by fulfillment service
            request.instructions());

    // Store session
    CheckoutSession session =
        new CheckoutSession(
            sessionId,
            cart.id(),
            orderNumber,
            storeNumber,
            customerSnapshot,
            lineItems,
            appliedDiscounts,
            fulfillmentDetails,
            reservationId,
            cart.totals().subtotal(),
            cart.totals().discountTotal(),
            cart.totals().taxTotal(),
            cart.totals().fulfillmentTotal(),
            cart.totals().grandTotal(),
            expiresAt);

    checkoutSessions.put(sessionId, session);

    return Mono.just(
        new CheckoutSummaryResponse(
            sessionId,
            cart.id(),
            orderNumber,
            storeNumber,
            customerSnapshot,
            lineItems,
            appliedDiscounts,
            fulfillmentDetails,
            reservationId,
            cart.totals().subtotal(),
            cart.totals().discountTotal(),
            cart.totals().taxTotal(),
            cart.totals().fulfillmentTotal(),
            cart.totals().grandTotal(),
            expiresAt));
  }

  private Mono<CheckoutSession> getCheckoutSession(String sessionId) {
    CheckoutSession session = checkoutSessions.get(sessionId);
    if (session == null) {
      return Mono.error(
          new ResponseStatusException(HttpStatus.NOT_FOUND, "Checkout session not found"));
    }
    return Mono.just(session);
  }

  private Mono<CheckoutSession> validateSession(CheckoutSession session, int storeNumber) {
    if (session.storeNumber() != storeNumber) {
      return Mono.error(
          new ResponseStatusException(
              HttpStatus.BAD_REQUEST, "Checkout session does not belong to this store"));
    }
    if (session.expiresAt().isBefore(Instant.now())) {
      checkoutSessions.remove(session.sessionId());
      return Mono.error(
          new ResponseStatusException(HttpStatus.GONE, "Checkout session has expired"));
    }
    return Mono.just(session);
  }

  private Mono<String> processPayment(
      CompleteCheckoutRequest request, CheckoutSession session, int storeNumber) {
    PaymentDetails paymentDetails =
        request.paymentDetails() != null
            ? new PaymentDetails(
                request.paymentDetails().cardLast4(),
                request.paymentDetails().cardBrand(),
                request.paymentDetails().cardToken(),
                request.paymentDetails().billingZip())
            : null;

    PaymentRequest paymentRequest =
        new PaymentRequest(
            session.orderNumber(),
            session.grandTotal(),
            request.paymentMethod(),
            paymentDetails,
            session.customer() != null ? session.customer().customerId() : null,
            storeNumber);

    return paymentGatewayClient
        .processPayment(paymentRequest)
        .flatMap(
            response -> {
              if (!response.success()) {
                // Cancel reservation on payment failure
                return fulfillmentServiceClient
                    .cancelReservation(session.reservationId())
                    .then(
                        Mono.error(
                            new ResponseStatusException(
                                HttpStatus.PAYMENT_REQUIRED,
                                "Payment failed: " + response.message())));
              }
              return Mono.just(response.paymentReference());
            });
  }

  private Mono<Order> createOrder(
      CheckoutSession session,
      String paymentReference,
      String paymentMethod,
      String createdBy,
      UUID userSessionId) {
    Instant now = Instant.now();

    Order order =
        Order.builder()
            .id(UUID.randomUUID())
            .storeNumber(session.storeNumber())
            .orderNumber(session.orderNumber())
            .customerId(session.customer() != null ? session.customer().customerId() : null)
            .fulfillmentType(session.fulfillment().type())
            .fulfillmentDate(session.fulfillment().scheduledDate())
            .reservationId(session.reservationId())
            .subtotal(session.subtotal())
            .discountTotal(session.discountTotal())
            .taxTotal(session.taxTotal())
            .fulfillmentCost(session.fulfillmentCost())
            .grandTotal(session.grandTotal())
            .paymentStatus(PaymentStatus.COMPLETED)
            .paymentMethod(paymentMethod)
            .paymentReference(paymentReference)
            .status(OrderStatus.PAID)
            .lineItems(session.lineItems())
            .appliedDiscounts(session.appliedDiscounts())
            .customerSnapshot(session.customer())
            .fulfillmentDetails(session.fulfillment())
            .createdAt(now)
            .updatedAt(now)
            .createdBy(createdBy)
            .sessionId(userSessionId)
            .build();

    // Remove checkout session after successful order creation
    checkoutSessions.remove(session.sessionId());

    return orderRepository.save(order);
  }

  private Mono<Void> markCartCompleted(Order order) {
    // Find the cart ID from the checkout session
    // Since we remove the session, we need to store cart ID in the order or session
    // For now, skip this step - cart service would need an endpoint for this
    return Mono.empty();
  }

  // ==================== Internal Records ====================

  private record CartWithReservation(CartDetails cart, UUID reservationId) {}

  private record SessionWithPayment(CheckoutSession session, String paymentReference) {}

  /** Checkout session stored temporarily until payment. */
  public record CheckoutSession(
      String sessionId,
      String cartId,
      String orderNumber,
      int storeNumber,
      CustomerSnapshot customer,
      List<OrderLineItem> lineItems,
      List<AppliedDiscount> appliedDiscounts,
      FulfillmentDetails fulfillment,
      UUID reservationId,
      BigDecimal subtotal,
      BigDecimal discountTotal,
      BigDecimal taxTotal,
      BigDecimal fulfillmentCost,
      BigDecimal grandTotal,
      Instant expiresAt) {}
}
