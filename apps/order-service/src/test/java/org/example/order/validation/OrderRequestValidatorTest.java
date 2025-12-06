package org.example.order.validation;

import java.util.UUID;
import org.example.order.dto.OrderSearchRequest;
import org.example.platform.error.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

/** Unit tests for OrderRequestValidator. */
class OrderRequestValidatorTest {

  private OrderRequestValidator validator;

  @BeforeEach
  void setUp() {
    validator = new OrderRequestValidator();
  }

  @Test
  void validateOrderId_validUuid_succeeds() {
    StepVerifier.create(validator.validateOrderId(UUID.randomUUID().toString())).verifyComplete();
  }

  @Test
  void validateOrderId_nullUuid_fails() {
    StepVerifier.create(validator.validateOrderId((String) null))
        .expectErrorMatches(
            ex ->
                ex instanceof ValidationException
                    && ((ValidationException) ex)
                        .getErrors().stream().anyMatch(e -> e.field().equals("orderId")))
        .verify();
  }

  @Test
  void validateOrderId_invalidUuid_fails() {
    StepVerifier.create(validator.validateOrderId("not-a-uuid"))
        .expectErrorMatches(
            ex ->
                ex instanceof ValidationException
                    && ((ValidationException) ex)
                        .getErrors().stream().anyMatch(e -> e.message().contains("valid UUID")))
        .verify();
  }

  @Test
  void validateStoreNumber_validNumber_succeeds() {
    StepVerifier.create(validator.validateStoreNumber(100)).verifyComplete();
  }

  @Test
  void validateStoreNumber_belowMin_fails() {
    StepVerifier.create(validator.validateStoreNumber(0))
        .expectErrorMatches(
            ex ->
                ex instanceof ValidationException
                    && ((ValidationException) ex)
                        .getErrors().stream().anyMatch(e -> e.field().equals("storeNumber")))
        .verify();
  }

  @Test
  void validateStoreNumber_aboveMax_fails() {
    StepVerifier.create(validator.validateStoreNumber(3000))
        .expectErrorMatches(
            ex ->
                ex instanceof ValidationException
                    && ((ValidationException) ex)
                        .getErrors().stream().anyMatch(e -> e.field().equals("storeNumber")))
        .verify();
  }

  @Test
  void validateCustomerId_validId_succeeds() {
    StepVerifier.create(validator.validateCustomerId("cust-123")).verifyComplete();
  }

  @Test
  void validateCustomerId_blankId_fails() {
    StepVerifier.create(validator.validateCustomerId(""))
        .expectErrorMatches(
            ex ->
                ex instanceof ValidationException
                    && ((ValidationException) ex)
                        .getErrors().stream().anyMatch(e -> e.field().equals("customerId")))
        .verify();
  }

  @Test
  void validateSearchRequest_validRequest_succeeds() {
    OrderSearchRequest request =
        new OrderSearchRequest(100, "cust-123", "CREATED", null, null, 0, 20);

    StepVerifier.create(validator.validateSearchRequest(request)).verifyComplete();
  }

  @Test
  void validateSearchRequest_invalidStatus_fails() {
    OrderSearchRequest request =
        new OrderSearchRequest(100, null, "INVALID_STATUS", null, null, 0, 20);

    StepVerifier.create(validator.validateSearchRequest(request))
        .expectErrorMatches(
            ex ->
                ex instanceof ValidationException
                    && ((ValidationException) ex)
                        .getErrors().stream().anyMatch(e -> e.field().equals("status")))
        .verify();
  }

  @Test
  void validateSearchRequest_invalidPageSize_fails() {
    OrderSearchRequest request = new OrderSearchRequest(100, null, null, null, null, 0, 500);

    StepVerifier.create(validator.validateSearchRequest(request))
        .expectErrorMatches(
            ex ->
                ex instanceof ValidationException
                    && ((ValidationException) ex)
                        .getErrors().stream().anyMatch(e -> e.field().equals("size")))
        .verify();
  }

  @Test
  void validateStatus_validStatus_succeeds() {
    StepVerifier.create(validator.validateStatus("CREATED")).verifyComplete();
  }

  @Test
  void validateStatus_invalidStatus_fails() {
    StepVerifier.create(validator.validateStatus("INVALID"))
        .expectErrorMatches(
            ex ->
                ex instanceof ValidationException
                    && ((ValidationException) ex)
                        .getErrors().stream().anyMatch(e -> e.field().equals("status")))
        .verify();
  }
}
