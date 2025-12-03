package org.example.product.validation;

import org.example.platform.error.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

class ProductRequestValidatorTest {

    private ProductRequestValidator validator;

    private static final long VALID_SKU = 123456L;
    private static final int VALID_STORE_NUMBER = 100;
    private static final String VALID_ORDER_NUMBER = "550e8400-e29b-41d4-a716-446655440000";
    private static final String VALID_USER_ID = "abc123";
    private static final String VALID_SESSION_ID = "660e8400-e29b-41d4-a716-446655440000";

    @BeforeEach
    void setUp() {
        validator = new ProductRequestValidator();
    }

    @Test
    void validRequest_succeeds() {
        StepVerifier.create(validator.validateProductRequest(
                VALID_SKU, VALID_STORE_NUMBER, VALID_ORDER_NUMBER, VALID_USER_ID, VALID_SESSION_ID))
            .verifyComplete();
    }

    @ParameterizedTest
    @ValueSource(longs = {0, 1, 99_999, -1, -100})
    void invalidSku_tooSmall_fails(long sku) {
        StepVerifier.create(validator.validateProductRequest(
                sku, VALID_STORE_NUMBER, VALID_ORDER_NUMBER, VALID_USER_ID, VALID_SESSION_ID))
            .expectErrorSatisfies(error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ex = (ValidationException) error;
                assertThat(ex.getErrors()).hasSize(1);
                assertThat(ex.getErrors().get(0).field()).isEqualTo("sku");
            })
            .verify();
    }

    @Test
    void invalidSku_tooLarge_fails() {
        long tooLargeSku = 1_000_000_000_000L;
        StepVerifier.create(validator.validateProductRequest(
                tooLargeSku, VALID_STORE_NUMBER, VALID_ORDER_NUMBER, VALID_USER_ID, VALID_SESSION_ID))
            .expectErrorSatisfies(error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ex = (ValidationException) error;
                assertThat(ex.getErrors()).hasSize(1);
                assertThat(ex.getErrors().get(0).field()).isEqualTo("sku");
            })
            .verify();
    }

    @Test
    void validSku_minBoundary_succeeds() {
        StepVerifier.create(validator.validateProductRequest(
                100_000L, VALID_STORE_NUMBER, VALID_ORDER_NUMBER, VALID_USER_ID, VALID_SESSION_ID))
            .verifyComplete();
    }

    @Test
    void validSku_maxBoundary_succeeds() {
        StepVerifier.create(validator.validateProductRequest(
                999_999_999_999L, VALID_STORE_NUMBER, VALID_ORDER_NUMBER, VALID_USER_ID, VALID_SESSION_ID))
            .verifyComplete();
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, -100, 2001, 3000})
    void invalidStoreNumber_fails(int storeNumber) {
        StepVerifier.create(validator.validateProductRequest(
                VALID_SKU, storeNumber, VALID_ORDER_NUMBER, VALID_USER_ID, VALID_SESSION_ID))
            .expectErrorSatisfies(error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ex = (ValidationException) error;
                assertThat(ex.getErrors()).hasSize(1);
                assertThat(ex.getErrors().get(0).field()).isEqualTo("x-store-number");
            })
            .verify();
    }

    @Test
    void validStoreNumber_minBoundary_succeeds() {
        StepVerifier.create(validator.validateProductRequest(
                VALID_SKU, 1, VALID_ORDER_NUMBER, VALID_USER_ID, VALID_SESSION_ID))
            .verifyComplete();
    }

    @Test
    void validStoreNumber_maxBoundary_succeeds() {
        StepVerifier.create(validator.validateProductRequest(
                VALID_SKU, 2000, VALID_ORDER_NUMBER, VALID_USER_ID, VALID_SESSION_ID))
            .verifyComplete();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "not-a-uuid", "12345", "550e8400-e29b-41d4-a716"})
    void invalidOrderNumber_fails(String orderNumber) {
        StepVerifier.create(validator.validateProductRequest(
                VALID_SKU, VALID_STORE_NUMBER, orderNumber, VALID_USER_ID, VALID_SESSION_ID))
            .expectErrorSatisfies(error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ex = (ValidationException) error;
                assertThat(ex.getErrors()).hasSize(1);
                assertThat(ex.getErrors().get(0).field()).isEqualTo("x-order-number");
            })
            .verify();
    }

    @Test
    void nullOrderNumber_fails() {
        StepVerifier.create(validator.validateProductRequest(
                VALID_SKU, VALID_STORE_NUMBER, null, VALID_USER_ID, VALID_SESSION_ID))
            .expectErrorSatisfies(error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ex = (ValidationException) error;
                assertThat(ex.getErrors()).hasSize(1);
                assertThat(ex.getErrors().get(0).field()).isEqualTo("x-order-number");
            })
            .verify();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "abc12", "abc1234", "abc12!", "abc 12", "ABC12@"})
    void invalidUserId_fails(String userId) {
        StepVerifier.create(validator.validateProductRequest(
                VALID_SKU, VALID_STORE_NUMBER, VALID_ORDER_NUMBER, userId, VALID_SESSION_ID))
            .expectErrorSatisfies(error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ex = (ValidationException) error;
                assertThat(ex.getErrors()).hasSize(1);
                assertThat(ex.getErrors().get(0).field()).isEqualTo("x-userid");
            })
            .verify();
    }

    @Test
    void nullUserId_fails() {
        StepVerifier.create(validator.validateProductRequest(
                VALID_SKU, VALID_STORE_NUMBER, VALID_ORDER_NUMBER, null, VALID_SESSION_ID))
            .expectErrorSatisfies(error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ex = (ValidationException) error;
                assertThat(ex.getErrors()).hasSize(1);
                assertThat(ex.getErrors().get(0).field()).isEqualTo("x-userid");
            })
            .verify();
    }

    @Test
    void validUserId_mixedCase_succeeds() {
        StepVerifier.create(validator.validateProductRequest(
                VALID_SKU, VALID_STORE_NUMBER, VALID_ORDER_NUMBER, "AbC123", VALID_SESSION_ID))
            .verifyComplete();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "not-a-uuid", "12345", "660e8400-e29b-41d4-a716"})
    void invalidSessionId_fails(String sessionId) {
        StepVerifier.create(validator.validateProductRequest(
                VALID_SKU, VALID_STORE_NUMBER, VALID_ORDER_NUMBER, VALID_USER_ID, sessionId))
            .expectErrorSatisfies(error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ex = (ValidationException) error;
                assertThat(ex.getErrors()).hasSize(1);
                assertThat(ex.getErrors().get(0).field()).isEqualTo("x-sessionid");
            })
            .verify();
    }

    @Test
    void nullSessionId_fails() {
        StepVerifier.create(validator.validateProductRequest(
                VALID_SKU, VALID_STORE_NUMBER, VALID_ORDER_NUMBER, VALID_USER_ID, null))
            .expectErrorSatisfies(error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ex = (ValidationException) error;
                assertThat(ex.getErrors()).hasSize(1);
                assertThat(ex.getErrors().get(0).field()).isEqualTo("x-sessionid");
            })
            .verify();
    }

    @Test
    void multipleInvalidFields_returnsAllErrors() {
        StepVerifier.create(validator.validateProductRequest(
                0L, 0, "invalid", "bad", "invalid"))
            .expectErrorSatisfies(error -> {
                assertThat(error).isInstanceOf(ValidationException.class);
                ValidationException ex = (ValidationException) error;
                assertThat(ex.getErrors()).hasSize(5);
                assertThat(ex.getErrors().stream().map(e -> e.field()))
                    .containsExactlyInAnyOrder("sku", "x-store-number", "x-order-number", "x-userid", "x-sessionid");
            })
            .verify();
    }

    @Test
    void toDetailsMap_containsValidationErrors() {
        StepVerifier.create(validator.validateProductRequest(
                0L, VALID_STORE_NUMBER, VALID_ORDER_NUMBER, VALID_USER_ID, VALID_SESSION_ID))
            .expectErrorSatisfies(error -> {
                ValidationException ex = (ValidationException) error;
                var details = ex.toDetailsMap();
                assertThat(details).containsKey("validationErrors");
                assertThat(details.get("validationErrors")).isInstanceOf(java.util.List.class);
            })
            .verify();
    }
}
