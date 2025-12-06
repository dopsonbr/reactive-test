package org.example.order.graphql;

import java.util.UUID;
import org.example.order.graphql.input.OrderSearchInput;
import org.example.order.graphql.input.UpdateFulfillmentInput;
import org.example.order.model.OrderStatus;
import org.example.platform.error.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

/** Unit tests for GraphQLInputValidator. */
class GraphQLInputValidatorTest {

  private GraphQLInputValidator validator;

  @BeforeEach
  void setUp() {
    validator = new GraphQLInputValidator();
  }

  @Nested
  class ValidateOrderId {

    @Test
    void validUuid_succeeds() {
      StepVerifier.create(validator.validateOrderId(UUID.randomUUID().toString())).verifyComplete();
    }

    @Test
    void nullId_fails() {
      StepVerifier.create(validator.validateOrderId(null))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("id")))
          .verify();
    }

    @Test
    void blankId_fails() {
      StepVerifier.create(validator.validateOrderId("  "))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("id")))
          .verify();
    }

    @Test
    void invalidUuid_fails() {
      StepVerifier.create(validator.validateOrderId("not-a-uuid"))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.message().contains("valid UUID")))
          .verify();
    }
  }

  @Nested
  class ValidateOrderNumber {

    @Test
    void validOrderNumber_succeeds() {
      StepVerifier.create(validator.validateOrderNumber("ORD-12345")).verifyComplete();
    }

    @Test
    void nullOrderNumber_fails() {
      StepVerifier.create(validator.validateOrderNumber(null))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("orderNumber")))
          .verify();
    }

    @Test
    void blankOrderNumber_fails() {
      StepVerifier.create(validator.validateOrderNumber(""))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("orderNumber")))
          .verify();
    }
  }

  @Nested
  class ValidateStoreNumber {

    @Test
    void validStoreNumber_succeeds() {
      StepVerifier.create(validator.validateStoreNumber(100)).verifyComplete();
    }

    @Test
    void minBoundary_succeeds() {
      StepVerifier.create(validator.validateStoreNumber(1)).verifyComplete();
    }

    @Test
    void maxBoundary_succeeds() {
      StepVerifier.create(validator.validateStoreNumber(2000)).verifyComplete();
    }

    @Test
    void belowMin_fails() {
      StepVerifier.create(validator.validateStoreNumber(0))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("storeNumber")))
          .verify();
    }

    @Test
    void aboveMax_fails() {
      StepVerifier.create(validator.validateStoreNumber(2001))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("storeNumber")))
          .verify();
    }
  }

  @Nested
  class ValidateCustomerId {

    @Test
    void validCustomerId_succeeds() {
      StepVerifier.create(validator.validateCustomerId("cust-123")).verifyComplete();
    }

    @Test
    void nullCustomerId_fails() {
      StepVerifier.create(validator.validateCustomerId(null))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("customerId")))
          .verify();
    }

    @Test
    void blankCustomerId_fails() {
      StepVerifier.create(validator.validateCustomerId(""))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("customerId")))
          .verify();
    }
  }

  @Nested
  class ValidatePagination {

    @Test
    void nullValues_succeeds() {
      StepVerifier.create(validator.validatePagination(null, null)).verifyComplete();
    }

    @Test
    void validValues_succeeds() {
      StepVerifier.create(validator.validatePagination(50, 10)).verifyComplete();
    }

    @Test
    void limitAtMin_succeeds() {
      StepVerifier.create(validator.validatePagination(1, 0)).verifyComplete();
    }

    @Test
    void limitAtMax_succeeds() {
      StepVerifier.create(validator.validatePagination(100, 0)).verifyComplete();
    }

    @Test
    void limitBelowMin_fails() {
      StepVerifier.create(validator.validatePagination(0, 0))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("limit")))
          .verify();
    }

    @Test
    void limitAboveMax_fails() {
      StepVerifier.create(validator.validatePagination(101, 0))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("limit")))
          .verify();
    }

    @Test
    void negativeOffset_fails() {
      StepVerifier.create(validator.validatePagination(50, -1))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("offset")))
          .verify();
    }

    @Test
    void bothInvalid_collectsAllErrors() {
      StepVerifier.create(validator.validatePagination(0, -1))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex).getErrors().size() == 2)
          .verify();
    }
  }

  @Nested
  class ValidateOrderSearch {

    @Test
    void validInput_succeeds() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, 50, 0);
      StepVerifier.create(validator.validateOrderSearch(input)).verifyComplete();
    }

    @Test
    void invalidStoreNumber_fails() {
      OrderSearchInput input = new OrderSearchInput(0, null, null, null, null, null, null);
      StepVerifier.create(validator.validateOrderSearch(input))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("storeNumber")))
          .verify();
    }

    @Test
    void invalidLimit_fails() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, 200, null);
      StepVerifier.create(validator.validateOrderSearch(input))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("limit")))
          .verify();
    }

    @Test
    void negativeOffset_fails() {
      OrderSearchInput input = new OrderSearchInput(100, null, null, null, null, null, -5);
      StepVerifier.create(validator.validateOrderSearch(input))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("offset")))
          .verify();
    }
  }

  @Nested
  class ValidateUpdateStatus {

    @Test
    void validInput_succeeds() {
      StepVerifier.create(
              validator.validateUpdateStatus(UUID.randomUUID().toString(), OrderStatus.CONFIRMED))
          .verifyComplete();
    }

    @Test
    void nullId_fails() {
      StepVerifier.create(validator.validateUpdateStatus(null, OrderStatus.CONFIRMED))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("id")))
          .verify();
    }

    @Test
    void nullStatus_fails() {
      StepVerifier.create(validator.validateUpdateStatus(UUID.randomUUID().toString(), null))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("status")))
          .verify();
    }

    @Test
    void bothInvalid_collectsAllErrors() {
      StepVerifier.create(validator.validateUpdateStatus(null, null))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex).getErrors().size() == 2)
          .verify();
    }
  }

  @Nested
  class ValidateUpdateFulfillment {

    @Test
    void validInput_succeeds() {
      UpdateFulfillmentInput input =
          new UpdateFulfillmentInput("2024-12-01T10:00:00Z", null, null, null);
      StepVerifier.create(validator.validateUpdateFulfillment(UUID.randomUUID().toString(), input))
          .verifyComplete();
    }

    @Test
    void withTrackingNumber_succeeds() {
      UpdateFulfillmentInput input = new UpdateFulfillmentInput(null, "TRACK123", null, null);
      StepVerifier.create(validator.validateUpdateFulfillment(UUID.randomUUID().toString(), input))
          .verifyComplete();
    }

    @Test
    void withCarrier_succeeds() {
      UpdateFulfillmentInput input = new UpdateFulfillmentInput(null, null, "FedEx", null);
      StepVerifier.create(validator.validateUpdateFulfillment(UUID.randomUUID().toString(), input))
          .verifyComplete();
    }

    @Test
    void withInstructions_succeeds() {
      UpdateFulfillmentInput input = new UpdateFulfillmentInput(null, null, null, "Leave at door");
      StepVerifier.create(validator.validateUpdateFulfillment(UUID.randomUUID().toString(), input))
          .verifyComplete();
    }

    @Test
    void nullInput_fails() {
      StepVerifier.create(validator.validateUpdateFulfillment(UUID.randomUUID().toString(), null))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("input")))
          .verify();
    }

    @Test
    void emptyInput_fails() {
      UpdateFulfillmentInput input = new UpdateFulfillmentInput(null, null, null, null);
      StepVerifier.create(validator.validateUpdateFulfillment(UUID.randomUUID().toString(), input))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("input")))
          .verify();
    }

    @Test
    void invalidId_fails() {
      UpdateFulfillmentInput input =
          new UpdateFulfillmentInput("2024-12-01T10:00:00Z", null, null, null);
      StepVerifier.create(validator.validateUpdateFulfillment("invalid-uuid", input))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("id")))
          .verify();
    }
  }

  @Nested
  class ValidateCancelOrder {

    @Test
    void validInput_succeeds() {
      StepVerifier.create(
              validator.validateCancelOrder(UUID.randomUUID().toString(), "Customer request"))
          .verifyComplete();
    }

    @Test
    void nullId_fails() {
      StepVerifier.create(validator.validateCancelOrder(null, "Customer request"))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("id")))
          .verify();
    }

    @Test
    void nullReason_fails() {
      StepVerifier.create(validator.validateCancelOrder(UUID.randomUUID().toString(), null))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("reason")))
          .verify();
    }

    @Test
    void blankReason_fails() {
      StepVerifier.create(validator.validateCancelOrder(UUID.randomUUID().toString(), "  "))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("reason")))
          .verify();
    }
  }

  @Nested
  class ValidateAddNote {

    @Test
    void validInput_succeeds() {
      StepVerifier.create(validator.validateAddNote(UUID.randomUUID().toString(), "Important note"))
          .verifyComplete();
    }

    @Test
    void nullId_fails() {
      StepVerifier.create(validator.validateAddNote(null, "Important note"))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("id")))
          .verify();
    }

    @Test
    void nullNote_fails() {
      StepVerifier.create(validator.validateAddNote(UUID.randomUUID().toString(), null))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("note")))
          .verify();
    }

    @Test
    void blankNote_fails() {
      StepVerifier.create(validator.validateAddNote(UUID.randomUUID().toString(), ""))
          .expectErrorMatches(
              ex ->
                  ex instanceof ValidationException
                      && ((ValidationException) ex)
                          .getErrors().stream().anyMatch(e -> e.field().equals("note")))
          .verify();
    }
  }
}
