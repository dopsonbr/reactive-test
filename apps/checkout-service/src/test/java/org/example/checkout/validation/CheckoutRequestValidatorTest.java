package org.example.checkout.validation;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.example.checkout.dto.CompleteCheckoutRequest;
import org.example.checkout.dto.InitiateCheckoutRequest;
import org.example.model.order.DeliveryAddress;
import org.example.model.order.FulfillmentType;
import org.example.platform.error.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

/** Unit tests for CheckoutRequestValidator. */
class CheckoutRequestValidatorTest {

  private CheckoutRequestValidator validator;

  // Valid header values
  private static final int VALID_STORE = 100;
  private static final String VALID_ORDER = UUID.randomUUID().toString();
  private static final String VALID_USER = "user01";
  private static final String VALID_SESSION = UUID.randomUUID().toString();

  @BeforeEach
  void setUp() {
    validator = new CheckoutRequestValidator();
  }

  // ==================== Initiate Checkout Tests ====================

  @Test
  void shouldValidateValidInitiateCheckoutRequest() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(
            UUID.randomUUID().toString(), FulfillmentType.IMMEDIATE, null, null, null);

    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .verifyComplete();
  }

  @Test
  void shouldRejectMissingCartId() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(null, FulfillmentType.IMMEDIATE, null, null, null);

    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream().anyMatch(e -> e.field().equals("cartId")))
        .verify();
  }

  @Test
  void shouldRejectInvalidCartIdFormat() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest("not-a-uuid", FulfillmentType.IMMEDIATE, null, null, null);

    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream()
                            .anyMatch(
                                e ->
                                    e.field().equals("cartId")
                                        && e.message().contains("valid UUID")))
        .verify();
  }

  @Test
  void shouldRejectMissingFulfillmentType() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(UUID.randomUUID().toString(), null, null, null, null);

    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream().anyMatch(e -> e.field().equals("fulfillmentType")))
        .verify();
  }

  @Test
  void shouldRequireFulfillmentDateForWillCall() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(
            UUID.randomUUID().toString(), FulfillmentType.WILL_CALL, null, null, null);

    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream()
                            .anyMatch(
                                e ->
                                    e.field().equals("fulfillmentDate")
                                        && e.message().contains("required")))
        .verify();
  }

  @Test
  void shouldRejectPastFulfillmentDateForWillCall() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(
            UUID.randomUUID().toString(),
            FulfillmentType.WILL_CALL,
            Instant.now().minus(1, ChronoUnit.DAYS),
            null,
            null);

    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream()
                            .anyMatch(
                                e ->
                                    e.field().equals("fulfillmentDate")
                                        && e.message().contains("future")))
        .verify();
  }

  @Test
  void shouldAcceptFutureFulfillmentDateForWillCall() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(
            UUID.randomUUID().toString(),
            FulfillmentType.WILL_CALL,
            Instant.now().plus(1, ChronoUnit.DAYS),
            null,
            null);

    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .verifyComplete();
  }

  @Test
  void shouldRequireDeliveryAddressForDelivery() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(
            UUID.randomUUID().toString(), FulfillmentType.DELIVERY, null, null, null);

    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream()
                            .anyMatch(
                                e ->
                                    e.field().equals("deliveryAddress")
                                        && e.message().contains("required")))
        .verify();
  }

  @Test
  void shouldValidateDeliveryAddressFields() {
    DeliveryAddress incompleteAddress = new DeliveryAddress(null, null, null, null, null, null);
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(
            UUID.randomUUID().toString(), FulfillmentType.DELIVERY, null, incompleteAddress, null);

    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error -> {
              if (!(error instanceof ValidationException)) return false;
              var errors = ((ValidationException) error).getErrors();
              return errors.stream().anyMatch(e -> e.field().contains("street1"))
                  && errors.stream().anyMatch(e -> e.field().contains("city"))
                  && errors.stream().anyMatch(e -> e.field().contains("state"))
                  && errors.stream().anyMatch(e -> e.field().contains("postalCode"));
            })
        .verify();
  }

  @Test
  void shouldAcceptCompleteDeliveryAddress() {
    DeliveryAddress completeAddress =
        new DeliveryAddress("123 Main St", "Apt 4", "New York", "NY", "10001", "US");
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(
            UUID.randomUUID().toString(), FulfillmentType.DELIVERY, null, completeAddress, null);

    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .verifyComplete();
  }

  // ==================== Complete Checkout Tests ====================

  @Test
  void shouldValidateValidCompleteCheckoutRequest() {
    CompleteCheckoutRequest request =
        new CompleteCheckoutRequest(UUID.randomUUID().toString(), "CASH", null);

    StepVerifier.create(
            validator.validateCompleteCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .verifyComplete();
  }

  @Test
  void shouldRejectMissingCheckoutSessionId() {
    CompleteCheckoutRequest request = new CompleteCheckoutRequest(null, "CASH", null);

    StepVerifier.create(
            validator.validateCompleteCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream().anyMatch(e -> e.field().equals("checkoutSessionId")))
        .verify();
  }

  @Test
  void shouldRejectMissingPaymentMethod() {
    CompleteCheckoutRequest request =
        new CompleteCheckoutRequest(UUID.randomUUID().toString(), null, null);

    StepVerifier.create(
            validator.validateCompleteCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream().anyMatch(e -> e.field().equals("paymentMethod")))
        .verify();
  }

  @Test
  void shouldRequirePaymentDetailsForCard() {
    CompleteCheckoutRequest request =
        new CompleteCheckoutRequest(UUID.randomUUID().toString(), "CARD", null);

    StepVerifier.create(
            validator.validateCompleteCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream().anyMatch(e -> e.field().equals("paymentDetails")))
        .verify();
  }

  @Test
  void shouldRequireCardTokenForCardPayment() {
    CompleteCheckoutRequest.PaymentDetails details =
        new CompleteCheckoutRequest.PaymentDetails("1234", "VISA", null, "10001");
    CompleteCheckoutRequest request =
        new CompleteCheckoutRequest(UUID.randomUUID().toString(), "CARD", details);

    StepVerifier.create(
            validator.validateCompleteCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream().anyMatch(e -> e.field().contains("cardToken")))
        .verify();
  }

  // ==================== Header Validation Tests ====================

  @Test
  void shouldRejectInvalidStoreNumber() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(
            UUID.randomUUID().toString(), FulfillmentType.IMMEDIATE, null, null, null);

    StepVerifier.create(
            validator.validateInitiateCheckout(request, 0, VALID_ORDER, VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream().anyMatch(e -> e.field().equals("x-store-number")))
        .verify();

    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, 2001, VALID_ORDER, VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream().anyMatch(e -> e.field().equals("x-store-number")))
        .verify();
  }

  @Test
  void shouldRejectInvalidOrderNumber() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(
            UUID.randomUUID().toString(), FulfillmentType.IMMEDIATE, null, null, null);

    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, "not-a-uuid", VALID_USER, VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream().anyMatch(e -> e.field().equals("x-order-number")))
        .verify();
  }

  @Test
  void shouldRejectInvalidUserId() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(
            UUID.randomUUID().toString(), FulfillmentType.IMMEDIATE, null, null, null);

    // Empty - should fail
    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, "", VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream().anyMatch(e -> e.field().equals("x-userid")))
        .verify();

    // Invalid characters (special chars not allowed)
    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, "user!1", VALID_SESSION))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream().anyMatch(e -> e.field().equals("x-userid")))
        .verify();
  }

  @Test
  void shouldAcceptRelaxedUserId() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(
            UUID.randomUUID().toString(), FulfillmentType.IMMEDIATE, null, null, null);

    // Short alphanumeric - now valid with 1-50 char pattern
    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, "abc", VALID_SESSION))
        .verifyComplete();

    // Underscores allowed with relaxed pattern
    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, "user_1", VALID_SESSION))
        .verifyComplete();

    // Kiosk-style IDs
    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, "KIOSK-001", VALID_SESSION))
        .verifyComplete();
  }

  @Test
  void shouldRejectInvalidSessionId() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(
            UUID.randomUUID().toString(), FulfillmentType.IMMEDIATE, null, null, null);

    // Empty - should fail
    StepVerifier.create(
            validator.validateInitiateCheckout(request, VALID_STORE, VALID_ORDER, VALID_USER, ""))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream().anyMatch(e -> e.field().equals("x-sessionid")))
        .verify();

    // Special characters - should fail
    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, "session!id"))
        .expectErrorMatches(
            error ->
                error instanceof ValidationException
                    && ((ValidationException) error)
                        .getErrors().stream().anyMatch(e -> e.field().equals("x-sessionid")))
        .verify();
  }

  @Test
  void shouldAcceptRelaxedSessionId() {
    InitiateCheckoutRequest request =
        new InitiateCheckoutRequest(
            UUID.randomUUID().toString(), FulfillmentType.IMMEDIATE, null, null, null);

    // Kiosk-style identifier - now valid with relaxed pattern
    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, "not-a-uuid"))
        .verifyComplete();

    // Another kiosk-style ID
    StepVerifier.create(
            validator.validateInitiateCheckout(
                request, VALID_STORE, VALID_ORDER, VALID_USER, "KIOSK-001"))
        .verifyComplete();
  }

  @Test
  void shouldCollectAllValidationErrors() {
    // Multiple invalid fields - use values that actually fail with relaxed patterns
    InitiateCheckoutRequest request = new InitiateCheckoutRequest("bad-id", null, null, null, null);

    StepVerifier.create(validator.validateInitiateCheckout(request, 0, "bad", "", "invalid!chars"))
        .expectErrorMatches(
            error -> {
              if (!(error instanceof ValidationException)) return false;
              var errors = ((ValidationException) error).getErrors();
              // Should have errors for: cartId, fulfillmentType, x-store-number,
              // x-order-number, x-userid, x-sessionid
              return errors.size() >= 6;
            })
        .verify();
  }
}
