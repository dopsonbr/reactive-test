package org.example.cart.validation;

import static org.assertj.core.api.Assertions.assertThat;

import org.example.cart.dto.AddProductRequest;
import org.example.cart.dto.ApplyDiscountRequest;
import org.example.cart.dto.CreateCartRequest;
import org.example.cart.dto.UpdateProductRequest;
import org.example.platform.error.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.test.StepVerifier;

/** Unit tests for CartRequestValidator. */
class CartRequestValidatorTest {

  private static final String VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
  private static final String VALID_USER_ID = "user01";
  private static final int VALID_STORE = 100;
  private static final long VALID_SKU = 123456L;
  private static final int VALID_QUANTITY = 1;

  private CartRequestValidator validator;

  @BeforeEach
  void setUp() {
    validator = new CartRequestValidator();
  }

  @Nested
  class CreateCartValidation {

    @Test
    void validRequest_succeeds() {
      CreateCartRequest request = new CreateCartRequest(VALID_STORE, null);

      StepVerifier.create(
              validator.validateCreateCart(
                  request, VALID_STORE, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .verifyComplete();
    }

    @Test
    void nullRequest_fails() {
      StepVerifier.create(
              validator.validateCreateCart(
                  null, VALID_STORE, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors()).hasSize(1);
                assertThat(ve.getErrors().get(0).field()).isEqualTo("body");
              })
          .verify();
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 2001, 3000})
    void invalidStoreNumber_fails(int storeNumber) {
      CreateCartRequest request = new CreateCartRequest(storeNumber, null);

      StepVerifier.create(
              validator.validateCreateCart(
                  request, VALID_STORE, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors()).anyMatch(e -> e.field().equals("storeNumber"));
              })
          .verify();
    }
  }

  @Nested
  class GetCartValidation {

    @Test
    void validRequest_succeeds() {
      StepVerifier.create(
              validator.validateGetCart(
                  VALID_UUID, VALID_STORE, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .verifyComplete();
    }

    @Test
    void nullCartId_fails() {
      StepVerifier.create(
              validator.validateGetCart(null, VALID_STORE, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors()).anyMatch(e -> e.field().equals("cartId"));
              })
          .verify();
    }

    @Test
    void invalidCartIdFormat_fails() {
      StepVerifier.create(
              validator.validateGetCart(
                  "not-a-uuid", VALID_STORE, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors())
                    .anyMatch(
                        e -> e.field().equals("cartId") && e.message().contains("valid UUID"));
              })
          .verify();
    }
  }

  @Nested
  class AddProductValidation {

    @Test
    void validRequest_succeeds() {
      AddProductRequest request = new AddProductRequest(VALID_SKU, VALID_QUANTITY);

      StepVerifier.create(
              validator.validateAddProduct(
                  VALID_UUID, request, VALID_STORE, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .verifyComplete();
    }

    @Test
    void nullRequest_fails() {
      StepVerifier.create(
              validator.validateAddProduct(
                  VALID_UUID, null, VALID_STORE, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors()).anyMatch(e -> e.field().equals("body"));
              })
          .verify();
    }

    @ParameterizedTest
    @ValueSource(longs = {0, 1, 99999, -1})
    void invalidSku_tooSmall_fails(long sku) {
      AddProductRequest request = new AddProductRequest(sku, VALID_QUANTITY);

      StepVerifier.create(
              validator.validateAddProduct(
                  VALID_UUID, request, VALID_STORE, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors()).anyMatch(e -> e.field().equals("sku"));
              })
          .verify();
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 1000, 1001})
    void invalidQuantity_fails(int quantity) {
      AddProductRequest request = new AddProductRequest(VALID_SKU, quantity);

      StepVerifier.create(
              validator.validateAddProduct(
                  VALID_UUID, request, VALID_STORE, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors()).anyMatch(e -> e.field().equals("quantity"));
              })
          .verify();
    }
  }

  @Nested
  class UpdateProductValidation {

    @Test
    void validRequest_succeeds() {
      UpdateProductRequest request = new UpdateProductRequest(5);

      StepVerifier.create(
              validator.validateUpdateProduct(
                  VALID_UUID,
                  VALID_SKU,
                  request,
                  VALID_STORE,
                  VALID_UUID,
                  VALID_USER_ID,
                  VALID_UUID))
          .verifyComplete();
    }

    @Test
    void validBoundaryValues_succeed() {
      // Min quantity
      UpdateProductRequest minRequest = new UpdateProductRequest(1);
      StepVerifier.create(
              validator.validateUpdateProduct(
                  VALID_UUID, 100_000L, minRequest, 1, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .verifyComplete();

      // Max quantity
      UpdateProductRequest maxRequest = new UpdateProductRequest(999);
      StepVerifier.create(
              validator.validateUpdateProduct(
                  VALID_UUID,
                  999_999_999_999L,
                  maxRequest,
                  2000,
                  VALID_UUID,
                  VALID_USER_ID,
                  VALID_UUID))
          .verifyComplete();
    }
  }

  @Nested
  class ApplyDiscountValidation {

    @Test
    void validRequest_succeeds() {
      ApplyDiscountRequest request = new ApplyDiscountRequest("SAVE10");

      StepVerifier.create(
              validator.validateApplyDiscount(
                  VALID_UUID, request, VALID_STORE, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .verifyComplete();
    }

    @Test
    void nullCode_fails() {
      ApplyDiscountRequest request = new ApplyDiscountRequest(null);

      StepVerifier.create(
              validator.validateApplyDiscount(
                  VALID_UUID, request, VALID_STORE, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors()).anyMatch(e -> e.field().equals("code"));
              })
          .verify();
    }

    @Test
    void blankCode_fails() {
      ApplyDiscountRequest request = new ApplyDiscountRequest("   ");

      StepVerifier.create(
              validator.validateApplyDiscount(
                  VALID_UUID, request, VALID_STORE, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors()).anyMatch(e -> e.field().equals("code"));
              })
          .verify();
    }
  }

  @Nested
  class CommonHeaderValidation {

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 2001, 3000})
    void invalidHeaderStoreNumber_fails(int storeNumber) {
      StepVerifier.create(
              validator.validateGetCart(
                  VALID_UUID, storeNumber, VALID_UUID, VALID_USER_ID, VALID_UUID))
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors()).anyMatch(e -> e.field().equals("x-store-number"));
              })
          .verify();
    }

    @Test
    void invalidOrderNumber_fails() {
      StepVerifier.create(
              validator.validateGetCart(
                  VALID_UUID, VALID_STORE, "not-a-uuid", VALID_USER_ID, VALID_UUID))
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors()).anyMatch(e -> e.field().equals("x-order-number"));
              })
          .verify();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "abc12!"})
    void invalidUserId_fails(String userId) {
      // Note: With relaxed patterns, only empty or special chars fail
      // "abc12" and "abc1234" are now valid (1-50 alphanumeric with hyphens/underscores)
      StepVerifier.create(
              validator.validateGetCart(VALID_UUID, VALID_STORE, VALID_UUID, userId, VALID_UUID))
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors()).anyMatch(e -> e.field().equals("x-userid"));
              })
          .verify();
    }

    @ParameterizedTest
    @ValueSource(strings = {"abc12", "abc1234", "KIOSK-001", "service-account-123"})
    void validUserId_succeeds(String userId) {
      // Relaxed pattern: 1-50 alphanumeric characters with hyphens/underscores
      StepVerifier.create(
              validator.validateGetCart(VALID_UUID, VALID_STORE, VALID_UUID, userId, VALID_UUID))
          .verifyComplete();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "invalid!chars", "has spaces"})
    void invalidSessionId_fails(String sessionId) {
      // Note: With relaxed patterns, "not-uuid" is now valid (matches kiosk-style identifier)
      // Only empty or special chars fail
      StepVerifier.create(
              validator.validateGetCart(
                  VALID_UUID, VALID_STORE, VALID_UUID, VALID_USER_ID, sessionId))
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                assertThat(ve.getErrors()).anyMatch(e -> e.field().equals("x-sessionid"));
              })
          .verify();
    }

    @ParameterizedTest
    @ValueSource(strings = {"not-uuid", "KIOSK-001", "session-123"})
    void validSessionId_kioskStyle_succeeds(String sessionId) {
      // Relaxed pattern: UUID OR 1-50 alphanumeric characters with hyphens/underscores
      StepVerifier.create(
              validator.validateGetCart(
                  VALID_UUID, VALID_STORE, VALID_UUID, VALID_USER_ID, sessionId))
          .verifyComplete();
    }

    @Test
    void multipleInvalidFields_returnsAllErrors() {
      StepVerifier.create(
              validator.validateGetCart(
                  "not-a-uuid", // invalid cartId
                  0, // invalid store
                  "not-uuid", // invalid order number
                  "", // invalid user id (empty)
                  "invalid!chars")) // invalid session (special chars)
          .expectErrorSatisfies(
              error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ve = (ValidationException) error;
                // Should have errors for all fields: cartId, store, order, userId, sessionId
                assertThat(ve.getErrors()).hasSizeGreaterThanOrEqualTo(5);
              })
          .verify();
    }
  }
}
