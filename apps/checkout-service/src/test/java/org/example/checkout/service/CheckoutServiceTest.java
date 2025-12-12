package org.example.checkout.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.example.checkout.client.CartServiceClient;
import org.example.checkout.client.CartServiceClient.CartCustomer;
import org.example.checkout.client.CartServiceClient.CartDetails;
import org.example.checkout.client.CartServiceClient.CartItem;
import org.example.checkout.client.CartServiceClient.CartTotals;
import org.example.checkout.client.DiscountServiceClient;
import org.example.checkout.client.DiscountServiceClient.DiscountResponse;
import org.example.checkout.client.FulfillmentServiceClient;
import org.example.checkout.client.FulfillmentServiceClient.ReservationResponse;
import org.example.checkout.client.PaymentGatewayClient;
import org.example.checkout.client.PaymentGatewayClient.PaymentResponse;
import org.example.checkout.dto.CompleteCheckoutRequest;
import org.example.checkout.dto.InitiateCheckoutRequest;
import org.example.checkout.event.OrderCompletedEventPublisher;
import org.example.checkout.repository.CheckoutSessionRepository;
import org.example.checkout.repository.CheckoutTransactionEntity;
import org.example.checkout.repository.CheckoutTransactionRepository;
import org.example.checkout.service.CheckoutService.CheckoutSession;
import org.example.checkout.validation.CartValidator;
import org.example.model.order.FulfillmentType;
import org.example.model.order.Order;
import org.example.model.order.OrderStatus;
import org.example.model.order.PaymentStatus;
import org.example.platform.logging.StructuredLogger;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/** Unit tests for CheckoutService with mocked dependencies. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CheckoutServiceTest {

  @Mock private CheckoutTransactionRepository transactionRepository;
  @Mock private CheckoutSessionRepository sessionRepository;
  @Mock private OrderCompletedEventPublisher eventPublisher;
  @Mock private CartServiceClient cartServiceClient;
  @Mock private DiscountServiceClient discountServiceClient;
  @Mock private FulfillmentServiceClient fulfillmentServiceClient;
  @Mock private PaymentGatewayClient paymentGatewayClient;
  @Mock private CartValidator cartValidator;
  @Mock private StructuredLogger structuredLogger;

  private CheckoutService checkoutService;

  // In-memory session store for testing
  private final ConcurrentHashMap<String, CheckoutSession> testSessionStore =
      new ConcurrentHashMap<>();

  private static final int STORE_NUMBER = 100;
  private static final String CART_ID = "550e8400-e29b-41d4-a716-446655440000";
  private static final String ORDER_NUMBER = "660e8400-e29b-41d4-a716-446655440000";
  private static final String USER_ID = "user01";
  private static final String SESSION_ID = "770e8400-e29b-41d4-a716-446655440000";

  @BeforeEach
  void setUp() {
    // Clear test session store
    testSessionStore.clear();

    checkoutService =
        new CheckoutService(
            transactionRepository,
            sessionRepository,
            eventPublisher,
            cartServiceClient,
            discountServiceClient,
            fulfillmentServiceClient,
            paymentGatewayClient,
            cartValidator,
            structuredLogger);

    // Mock session repository to use in-memory store for testing
    when(sessionRepository.save(any(CheckoutSession.class)))
        .thenAnswer(
            invocation -> {
              CheckoutSession session = invocation.getArgument(0);
              testSessionStore.put(session.sessionId(), session);
              return Mono.empty();
            });

    when(sessionRepository.findById(anyString()))
        .thenAnswer(
            invocation -> {
              String sessionId = invocation.getArgument(0);
              CheckoutSession session = testSessionStore.get(sessionId);
              return session != null ? Mono.just(session) : Mono.empty();
            });

    when(sessionRepository.deleteById(anyString()))
        .thenAnswer(
            invocation -> {
              String sessionId = invocation.getArgument(0);
              testSessionStore.remove(sessionId);
              return Mono.empty();
            });
  }

  @Nested
  class InitiateCheckoutTests {

    @Test
    void shouldInitiateCheckoutSuccessfully() {
      // Given
      CartDetails cart = createValidCart();
      InitiateCheckoutRequest request =
          new InitiateCheckoutRequest(CART_ID, FulfillmentType.IMMEDIATE, null, null, null);

      when(cartServiceClient.getCart(CART_ID, STORE_NUMBER)).thenReturn(Mono.just(cart));
      when(cartValidator.validateForCheckout(cart, STORE_NUMBER)).thenReturn(Mono.empty());
      when(discountServiceClient.validateAndCalculateDiscounts(any()))
          .thenReturn(Mono.just(createValidDiscountResponse()));
      when(fulfillmentServiceClient.createReservation(any()))
          .thenReturn(Mono.just(createValidReservationResponse()));

      // When/Then
      StepVerifier.create(
              checkoutService
                  .initiateCheckout(request, STORE_NUMBER)
                  .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, createMetadata())))
          .assertNext(
              response -> {
                assertThat(response.checkoutSessionId()).isNotNull();
                assertThat(response.cartId()).isEqualTo(CART_ID);
                assertThat(response.storeNumber()).isEqualTo(STORE_NUMBER);
                assertThat(response.grandTotal()).isEqualTo(new BigDecimal("54.00"));
                assertThat(response.lineItems()).hasSize(1);
                assertThat(response.expiresAt()).isAfter(Instant.now());
              })
          .verifyComplete();
    }

    @Test
    void shouldFailWhenCartNotFound() {
      // Given
      InitiateCheckoutRequest request =
          new InitiateCheckoutRequest(CART_ID, FulfillmentType.IMMEDIATE, null, null, null);

      when(cartServiceClient.getCart(CART_ID, STORE_NUMBER))
          .thenReturn(
              Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found")));

      // When/Then
      StepVerifier.create(
              checkoutService
                  .initiateCheckout(request, STORE_NUMBER)
                  .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, createMetadata())))
          .expectErrorMatches(
              error ->
                  error instanceof ResponseStatusException
                      && ((ResponseStatusException) error).getStatusCode() == HttpStatus.NOT_FOUND)
          .verify();
    }

    @Test
    void shouldFailWhenCartValidationFails() {
      // Given
      CartDetails cart = createValidCart();
      InitiateCheckoutRequest request =
          new InitiateCheckoutRequest(CART_ID, FulfillmentType.IMMEDIATE, null, null, null);

      when(cartServiceClient.getCart(CART_ID, STORE_NUMBER)).thenReturn(Mono.just(cart));
      when(cartValidator.validateForCheckout(cart, STORE_NUMBER))
          .thenReturn(
              Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid cart")));

      // When/Then
      StepVerifier.create(
              checkoutService
                  .initiateCheckout(request, STORE_NUMBER)
                  .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, createMetadata())))
          .expectErrorMatches(
              error ->
                  error instanceof ResponseStatusException
                      && ((ResponseStatusException) error).getStatusCode()
                          == HttpStatus.BAD_REQUEST)
          .verify();

      verify(discountServiceClient, never()).validateAndCalculateDiscounts(any());
    }

    @Test
    void shouldFailWhenDiscountValidationFails() {
      // Given
      CartDetails cart = createCartWithDiscounts();
      InitiateCheckoutRequest request =
          new InitiateCheckoutRequest(CART_ID, FulfillmentType.IMMEDIATE, null, null, null);

      when(cartServiceClient.getCart(CART_ID, STORE_NUMBER)).thenReturn(Mono.just(cart));
      when(cartValidator.validateForCheckout(cart, STORE_NUMBER)).thenReturn(Mono.empty());
      when(discountServiceClient.validateAndCalculateDiscounts(any()))
          .thenReturn(Mono.just(createInvalidDiscountResponse()));

      // When/Then
      StepVerifier.create(
              checkoutService
                  .initiateCheckout(request, STORE_NUMBER)
                  .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, createMetadata())))
          .expectErrorMatches(
              error ->
                  error instanceof ResponseStatusException
                      && ((ResponseStatusException) error).getStatusCode() == HttpStatus.BAD_REQUEST
                      && error.getMessage().contains("Invalid discount"))
          .verify();

      verify(fulfillmentServiceClient, never()).createReservation(any());
    }

    @Test
    void shouldFailWhenFulfillmentReservationFails() {
      // Given
      CartDetails cart = createValidCart();
      // Use WILL_CALL to trigger actual fulfillment reservation (IMMEDIATE skips reservation)
      InitiateCheckoutRequest request =
          new InitiateCheckoutRequest(
              CART_ID,
              FulfillmentType.WILL_CALL,
              Instant.now().plus(1, java.time.temporal.ChronoUnit.DAYS),
              null,
              null);

      when(cartServiceClient.getCart(CART_ID, STORE_NUMBER)).thenReturn(Mono.just(cart));
      when(cartValidator.validateForCheckout(cart, STORE_NUMBER)).thenReturn(Mono.empty());
      when(discountServiceClient.validateAndCalculateDiscounts(any()))
          .thenReturn(Mono.just(createValidDiscountResponse()));
      when(fulfillmentServiceClient.createReservation(any()))
          .thenReturn(Mono.just(createUnavailableItemsResponse()));

      // When/Then
      StepVerifier.create(
              checkoutService
                  .initiateCheckout(request, STORE_NUMBER)
                  .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, createMetadata())))
          .expectErrorMatches(
              error ->
                  error instanceof ResponseStatusException
                      && ((ResponseStatusException) error).getStatusCode() == HttpStatus.CONFLICT)
          .verify();
    }
  }

  @Nested
  class CompleteCheckoutTests {

    @Test
    void shouldCompleteCheckoutSuccessfully() {
      // First initiate checkout to create a session
      CartDetails cart = createValidCart();
      InitiateCheckoutRequest initiateRequest =
          new InitiateCheckoutRequest(CART_ID, FulfillmentType.IMMEDIATE, null, null, null);

      when(cartServiceClient.getCart(CART_ID, STORE_NUMBER)).thenReturn(Mono.just(cart));
      when(cartValidator.validateForCheckout(cart, STORE_NUMBER)).thenReturn(Mono.empty());
      when(discountServiceClient.validateAndCalculateDiscounts(any()))
          .thenReturn(Mono.just(createValidDiscountResponse()));
      when(fulfillmentServiceClient.createReservation(any()))
          .thenReturn(Mono.just(createValidReservationResponse()));

      // Get checkout session ID
      String checkoutSessionId =
          checkoutService
              .initiateCheckout(initiateRequest, STORE_NUMBER)
              .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, createMetadata()))
              .block()
              .checkoutSessionId();

      // Set up complete checkout mocks
      when(paymentGatewayClient.processPayment(any()))
          .thenReturn(Mono.just(createSuccessfulPaymentResponse()));
      when(transactionRepository.save(any(CheckoutTransactionEntity.class)))
          .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
      when(eventPublisher.publishOrderCompleted(any(Order.class), anyString()))
          .thenReturn(Mono.just("msg-123"));

      // Complete checkout
      CompleteCheckoutRequest completeRequest =
          new CompleteCheckoutRequest(checkoutSessionId, "CASH", null);

      StepVerifier.create(
              checkoutService
                  .completeCheckout(completeRequest, STORE_NUMBER)
                  .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, createMetadata())))
          .assertNext(
              response -> {
                assertThat(response.orderId()).isNotNull();
                assertThat(response.storeNumber()).isEqualTo(STORE_NUMBER);
                assertThat(response.status()).isEqualTo(OrderStatus.PAID);
                assertThat(response.paymentStatus()).isEqualTo(PaymentStatus.COMPLETED);
                assertThat(response.paymentMethod()).isEqualTo("CASH");
                assertThat(response.paymentReference()).startsWith("PAY-");
              })
          .verifyComplete();
    }

    @Test
    void shouldFailWhenSessionNotFound() {
      // Given
      CompleteCheckoutRequest request =
          new CompleteCheckoutRequest(UUID.randomUUID().toString(), "CASH", null);

      // When/Then
      StepVerifier.create(
              checkoutService
                  .completeCheckout(request, STORE_NUMBER)
                  .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, createMetadata())))
          .expectErrorMatches(
              error ->
                  error instanceof ResponseStatusException
                      && ((ResponseStatusException) error).getStatusCode() == HttpStatus.NOT_FOUND
                      && error.getMessage().contains("session not found"))
          .verify();
    }

    @Test
    void shouldFailWhenSessionBelongsToDifferentStore() {
      // Create session for store 100
      CartDetails cart = createValidCart();
      InitiateCheckoutRequest initiateRequest =
          new InitiateCheckoutRequest(CART_ID, FulfillmentType.IMMEDIATE, null, null, null);

      when(cartServiceClient.getCart(CART_ID, STORE_NUMBER)).thenReturn(Mono.just(cart));
      when(cartValidator.validateForCheckout(cart, STORE_NUMBER)).thenReturn(Mono.empty());
      when(discountServiceClient.validateAndCalculateDiscounts(any()))
          .thenReturn(Mono.just(createValidDiscountResponse()));
      when(fulfillmentServiceClient.createReservation(any()))
          .thenReturn(Mono.just(createValidReservationResponse()));

      String checkoutSessionId =
          checkoutService
              .initiateCheckout(initiateRequest, STORE_NUMBER)
              .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, createMetadata()))
              .block()
              .checkoutSessionId();

      // Try to complete for different store
      CompleteCheckoutRequest completeRequest =
          new CompleteCheckoutRequest(checkoutSessionId, "CASH", null);

      StepVerifier.create(
              checkoutService
                  .completeCheckout(completeRequest, 200) // Different store
                  .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, createMetadata())))
          .expectErrorMatches(
              error ->
                  error instanceof ResponseStatusException
                      && ((ResponseStatusException) error).getStatusCode() == HttpStatus.BAD_REQUEST
                      && error.getMessage().contains("does not belong"))
          .verify();
    }

    @Test
    void shouldFailAndCancelReservationWhenPaymentFails() {
      // Create session
      CartDetails cart = createValidCart();
      InitiateCheckoutRequest initiateRequest =
          new InitiateCheckoutRequest(CART_ID, FulfillmentType.IMMEDIATE, null, null, null);

      when(cartServiceClient.getCart(CART_ID, STORE_NUMBER)).thenReturn(Mono.just(cart));
      when(cartValidator.validateForCheckout(cart, STORE_NUMBER)).thenReturn(Mono.empty());
      when(discountServiceClient.validateAndCalculateDiscounts(any()))
          .thenReturn(Mono.just(createValidDiscountResponse()));
      when(fulfillmentServiceClient.createReservation(any()))
          .thenReturn(Mono.just(createValidReservationResponse()));

      String checkoutSessionId =
          checkoutService
              .initiateCheckout(initiateRequest, STORE_NUMBER)
              .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, createMetadata()))
              .block()
              .checkoutSessionId();

      // Payment fails
      when(paymentGatewayClient.processPayment(any()))
          .thenReturn(Mono.just(createFailedPaymentResponse()));
      when(fulfillmentServiceClient.cancelReservation(any())).thenReturn(Mono.empty());

      CompleteCheckoutRequest completeRequest =
          new CompleteCheckoutRequest(
              checkoutSessionId,
              "CARD",
              new CompleteCheckoutRequest.PaymentDetails("1234", "VISA", "tok_test", "10001"));

      StepVerifier.create(
              checkoutService
                  .completeCheckout(completeRequest, STORE_NUMBER)
                  .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, createMetadata())))
          .expectErrorMatches(
              error ->
                  error instanceof ResponseStatusException
                      && ((ResponseStatusException) error).getStatusCode()
                          == HttpStatus.PAYMENT_REQUIRED)
          .verify();

      // Verify reservation was cancelled
      verify(fulfillmentServiceClient).cancelReservation(any());
    }
  }

  // NOTE: GetOrderTests and ListOrdersTests have been removed.
  // Order query operations are now handled by order-service, which consumes
  // OrderCompleted events published by checkout-service.

  // ==================== Test Data Helpers ====================

  private CartDetails createValidCart() {
    return new CartDetails(
        CART_ID,
        STORE_NUMBER,
        "customer-1",
        new CartCustomer("customer-1", "John", "Doe", "john@example.com", "555-1234", "GOLD"),
        List.of(
            new CartItem(
                "prod-1",
                123456L,
                "Test Product",
                2,
                new BigDecimal("25.00"),
                new BigDecimal("50.00"))),
        List.of(),
        new CartTotals(
            new BigDecimal("50.00"),
            BigDecimal.ZERO,
            new BigDecimal("4.00"),
            BigDecimal.ZERO,
            new BigDecimal("54.00")),
        Instant.now(),
        Instant.now());
  }

  private CartDetails createCartWithDiscounts() {
    return new CartDetails(
        CART_ID,
        STORE_NUMBER,
        "customer-1",
        new CartCustomer("customer-1", "John", "Doe", "john@example.com", "555-1234", "GOLD"),
        List.of(
            new CartItem(
                "prod-1",
                123456L,
                "Test Product",
                2,
                new BigDecimal("25.00"),
                new BigDecimal("50.00"))),
        List.of(
            new CartServiceClient.CartDiscount(
                "disc-1", "SAVE10", "PERCENTAGE", new BigDecimal("10"), new BigDecimal("5.00"))),
        new CartTotals(
            new BigDecimal("50.00"),
            new BigDecimal("5.00"),
            new BigDecimal("3.60"),
            BigDecimal.ZERO,
            new BigDecimal("48.60")),
        Instant.now(),
        Instant.now());
  }

  private DiscountResponse createValidDiscountResponse() {
    return new DiscountResponse(true, List.of(), BigDecimal.ZERO, List.of(), List.of());
  }

  private DiscountResponse createInvalidDiscountResponse() {
    return new DiscountResponse(
        false, List.of(), BigDecimal.ZERO, List.of("INVALID_CODE"), List.of("Code not found"));
  }

  private ReservationResponse createValidReservationResponse() {
    return new ReservationResponse(
        UUID.randomUUID(),
        "RESERVED",
        Instant.now().plusSeconds(900),
        BigDecimal.ZERO,
        List.of(new FulfillmentServiceClient.ReservedItem(123456L, 2, "SHELF-A1")),
        List.of());
  }

  private ReservationResponse createUnavailableItemsResponse() {
    return new ReservationResponse(
        null,
        "PARTIAL",
        null,
        BigDecimal.ZERO,
        List.of(),
        List.of(new FulfillmentServiceClient.UnavailableItem(123456L, 2, 0)));
  }

  private PaymentResponse createSuccessfulPaymentResponse() {
    return new PaymentResponse(
        true, "PAY-ABC12345", "Payment processed successfully", new BigDecimal("54.00"));
  }

  private PaymentResponse createFailedPaymentResponse() {
    return new PaymentResponse(false, null, "Insufficient funds", BigDecimal.ZERO);
  }

  private RequestMetadata createMetadata() {
    return new RequestMetadata(STORE_NUMBER, ORDER_NUMBER, USER_ID, SESSION_ID);
  }
}
