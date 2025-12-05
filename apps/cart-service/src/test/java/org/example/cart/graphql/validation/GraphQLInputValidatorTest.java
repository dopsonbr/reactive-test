package org.example.cart.graphql.validation;

import java.util.List;
import org.example.cart.graphql.input.AddFulfillmentInput;
import org.example.cart.graphql.input.AddProductInput;
import org.example.cart.graphql.input.CreateCartInput;
import org.example.cart.graphql.input.SetCustomerInput;
import org.example.model.fulfillment.FulfillmentType;
import org.example.platform.error.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.test.StepVerifier;

class GraphQLInputValidatorTest {

    private GraphQLInputValidator validator;

    @BeforeEach
    void setUp() {
        validator = new GraphQLInputValidator();
    }

    @Nested
    class CreateCartValidation {
        @Test
        void shouldAcceptValidInput() {
            var input = new CreateCartInput(100, "cust-123");
            StepVerifier.create(validator.validateCreateCart(input)).verifyComplete();
        }

        @Test
        void shouldAcceptValidInputWithoutCustomerId() {
            var input = new CreateCartInput(100, null);
            StepVerifier.create(validator.validateCreateCart(input)).verifyComplete();
        }

        @ParameterizedTest
        @ValueSource(ints = {0, -1, 2001, 9999})
        void shouldRejectInvalidStoreNumber(int storeNumber) {
            var input = new CreateCartInput(storeNumber, null);
            StepVerifier.create(validator.validateCreateCart(input))
                    .expectErrorMatches(
                            e ->
                                    e instanceof ValidationException ve
                                            && ve.getErrors().stream()
                                                    .anyMatch(
                                                            err ->
                                                                    err.field()
                                                                            .equals("storeNumber")))
                    .verify();
        }
    }

    @Nested
    class CartIdValidation {
        private static final String VALID_CART_ID = "550e8400-e29b-41d4-a716-446655440000";

        @Test
        void shouldAcceptValidUuid() {
            StepVerifier.create(validator.validateCartId(VALID_CART_ID)).verifyComplete();
        }

        @Test
        void shouldRejectNullCartId() {
            StepVerifier.create(validator.validateCartId(null))
                    .expectErrorMatches(
                            e ->
                                    e instanceof ValidationException ve
                                            && ve.getErrors().stream()
                                                    .anyMatch(
                                                            err ->
                                                                    err.field().equals("cartId")
                                                                            && err.message()
                                                                                    .equals(
                                                                                            "Required")))
                    .verify();
        }

        @Test
        void shouldRejectBlankCartId() {
            StepVerifier.create(validator.validateCartId("  "))
                    .expectErrorMatches(
                            e ->
                                    e instanceof ValidationException ve
                                            && ve.getErrors().stream()
                                                    .anyMatch(err -> err.field().equals("cartId")))
                    .verify();
        }

        @Test
        void shouldRejectInvalidUuidFormat() {
            StepVerifier.create(validator.validateCartId("not-a-uuid"))
                    .expectErrorMatches(
                            e ->
                                    e instanceof ValidationException ve
                                            && ve.getErrors().stream()
                                                    .anyMatch(
                                                            err ->
                                                                    err.field().equals("cartId")
                                                                            && err.message()
                                                                                    .contains(
                                                                                            "UUID")))
                    .verify();
        }
    }

    @Nested
    class AddProductValidation {
        private static final String VALID_CART_ID = "550e8400-e29b-41d4-a716-446655440000";

        @Test
        void shouldAcceptValidInput() {
            var input = new AddProductInput("123456", 5);
            StepVerifier.create(validator.validateAddProduct(VALID_CART_ID, input))
                    .verifyComplete();
        }

        @Test
        void shouldCollectAllErrors() {
            var input = new AddProductInput("invalid", 0);
            StepVerifier.create(validator.validateAddProduct("not-a-uuid", input))
                    .expectErrorMatches(
                            e ->
                                    e instanceof ValidationException ve
                                            && ve.getErrors().size() >= 3) // cartId, sku, quantity
                    .verify();
        }

        @ParameterizedTest
        @ValueSource(ints = {0, -1, 1000, 9999})
        void shouldRejectInvalidQuantity(int quantity) {
            var input = new AddProductInput("123456", quantity);
            StepVerifier.create(validator.validateAddProduct(VALID_CART_ID, input))
                    .expectErrorMatches(
                            e ->
                                    e instanceof ValidationException ve
                                            && ve.getErrors().stream()
                                                    .anyMatch(
                                                            err ->
                                                                    err.field()
                                                                            .equals(
                                                                                    "input.quantity")))
                    .verify();
        }

        @Test
        void shouldRejectInvalidSku() {
            var input = new AddProductInput("99999", 5); // Too small
            StepVerifier.create(validator.validateAddProduct(VALID_CART_ID, input))
                    .expectErrorMatches(
                            e ->
                                    e instanceof ValidationException ve
                                            && ve.getErrors().stream()
                                                    .anyMatch(
                                                            err -> err.field().equals("input.sku")))
                    .verify();
        }

        @Test
        void shouldRejectNonNumericSku() {
            var input = new AddProductInput("abc123", 5);
            StepVerifier.create(validator.validateAddProduct(VALID_CART_ID, input))
                    .expectErrorMatches(
                            e ->
                                    e instanceof ValidationException ve
                                            && ve.getErrors().stream()
                                                    .anyMatch(
                                                            err ->
                                                                    err.field().equals("input.sku")
                                                                            && err.message()
                                                                                    .contains(
                                                                                            "number")))
                    .verify();
        }
    }

    @Nested
    class SetCustomerValidation {
        private static final String VALID_CART_ID = "550e8400-e29b-41d4-a716-446655440000";

        @Test
        void shouldAcceptValidInput() {
            var input = new SetCustomerInput("cust-123", "John Doe", "john@example.com");
            StepVerifier.create(validator.validateSetCustomer(VALID_CART_ID, input))
                    .verifyComplete();
        }

        @Test
        void shouldRejectInvalidEmail() {
            var input = new SetCustomerInput("cust-123", "John Doe", "not-an-email");
            StepVerifier.create(validator.validateSetCustomer(VALID_CART_ID, input))
                    .expectErrorMatches(
                            e ->
                                    e instanceof ValidationException ve
                                            && ve.getErrors().stream()
                                                    .anyMatch(
                                                            err ->
                                                                    err.field()
                                                                                    .equals(
                                                                                            "input.email")
                                                                            && err.message()
                                                                                    .contains(
                                                                                            "email")))
                    .verify();
        }

        @Test
        void shouldRejectBlankName() {
            var input = new SetCustomerInput("cust-123", "  ", "john@example.com");
            StepVerifier.create(validator.validateSetCustomer(VALID_CART_ID, input))
                    .expectErrorMatches(
                            e ->
                                    e instanceof ValidationException ve
                                            && ve.getErrors().stream()
                                                    .anyMatch(
                                                            err ->
                                                                    err.field()
                                                                            .equals("input.name")))
                    .verify();
        }
    }

    @Nested
    class AddFulfillmentValidation {
        private static final String VALID_CART_ID = "550e8400-e29b-41d4-a716-446655440000";

        @Test
        void shouldAcceptValidInput() {
            var input = new AddFulfillmentInput(FulfillmentType.DELIVERY, List.of("123456"));
            StepVerifier.create(validator.validateAddFulfillment(VALID_CART_ID, input))
                    .verifyComplete();
        }

        @Test
        void shouldRejectNullType() {
            var input = new AddFulfillmentInput(null, List.of("123456"));
            StepVerifier.create(validator.validateAddFulfillment(VALID_CART_ID, input))
                    .expectErrorMatches(
                            e ->
                                    e instanceof ValidationException ve
                                            && ve.getErrors().stream()
                                                    .anyMatch(
                                                            err ->
                                                                    err.field()
                                                                            .equals("input.type")))
                    .verify();
        }

        @Test
        void shouldRejectEmptySkuList() {
            var input = new AddFulfillmentInput(FulfillmentType.DELIVERY, List.of());
            StepVerifier.create(validator.validateAddFulfillment(VALID_CART_ID, input))
                    .expectErrorMatches(
                            e ->
                                    e instanceof ValidationException ve
                                            && ve.getErrors().stream()
                                                    .anyMatch(
                                                            err ->
                                                                    err.field()
                                                                            .equals("input.skus")))
                    .verify();
        }

        @Test
        void shouldValidateEachSkuInList() {
            var input =
                    new AddFulfillmentInput(FulfillmentType.DELIVERY, List.of("123456", "invalid"));
            StepVerifier.create(validator.validateAddFulfillment(VALID_CART_ID, input))
                    .expectErrorMatches(
                            e ->
                                    e instanceof ValidationException ve
                                            && ve.getErrors().stream()
                                                    .anyMatch(
                                                            err ->
                                                                    err.field()
                                                                            .equals(
                                                                                    "input.skus[1]")))
                    .verify();
        }
    }
}
