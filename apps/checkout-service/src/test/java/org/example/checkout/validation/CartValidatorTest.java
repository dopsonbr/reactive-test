package org.example.checkout.validation;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.example.checkout.client.CartServiceClient.CartCustomer;
import org.example.checkout.client.CartServiceClient.CartDetails;
import org.example.checkout.client.CartServiceClient.CartItem;
import org.example.checkout.client.CartServiceClient.CartTotals;
import org.example.platform.error.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

/** Unit tests for CartValidator. */
class CartValidatorTest {

  private CartValidator validator;
  private static final int STORE_NUMBER = 100;

  @BeforeEach
  void setUp() {
    validator = new CartValidator();
  }

  @Nested
  class ValidCartTests {

    @Test
    void shouldAcceptValidCart() {
      CartDetails cart = createValidCart();

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER)).verifyComplete();
    }

    @Test
    void shouldAcceptCartWithMultipleItems() {
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              List.of(
                  new CartItem(
                      "prod-1",
                      123456L,
                      "Product 1",
                      2,
                      new BigDecimal("10.00"),
                      new BigDecimal("20.00")),
                  new CartItem(
                      "prod-2",
                      789012L,
                      "Product 2",
                      1,
                      new BigDecimal("30.00"),
                      new BigDecimal("30.00"))),
              List.of(),
              new CartTotals(
                  new BigDecimal("50.00"),
                  BigDecimal.ZERO,
                  new BigDecimal("4.00"),
                  BigDecimal.ZERO,
                  new BigDecimal("54.00")),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER)).verifyComplete();
    }
  }

  @Nested
  class NullCartTests {

    @Test
    void shouldRejectNullCart() {
      StepVerifier.create(validator.validateForCheckout(null, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream().anyMatch(e -> e.field().equals("cart")))
          .verify();
    }
  }

  @Nested
  class StoreNumberValidationTests {

    @Test
    void shouldRejectCartFromDifferentStore() {
      CartDetails cart = createValidCartForStore(200);

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream()
                              .anyMatch(
                                  e ->
                                      e.field().equals("cart.storeNumber")
                                          && e.message().contains("does not belong")))
          .verify();
    }
  }

  @Nested
  class ItemsValidationTests {

    @Test
    void shouldRejectCartWithNullItems() {
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              null,
              List.of(),
              createValidTotals(),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream()
                              .anyMatch(
                                  e ->
                                      e.field().equals("cart.items")
                                          && e.message().contains("at least one")))
          .verify();
    }

    @Test
    void shouldRejectCartWithEmptyItems() {
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              List.of(),
              List.of(),
              createValidTotals(),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream()
                              .anyMatch(
                                  e ->
                                      e.field().equals("cart.items")
                                          && e.message().contains("at least one")))
          .verify();
    }

    @Test
    void shouldRejectItemWithZeroQuantity() {
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              List.of(
                  new CartItem(
                      "prod-1", 123456L, "Product 1", 0, new BigDecimal("10.00"), BigDecimal.ZERO)),
              List.of(),
              createValidTotals(),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream()
                              .anyMatch(
                                  e ->
                                      e.field().contains("quantity")
                                          && e.message().contains("between")))
          .verify();
    }

    @Test
    void shouldRejectItemWithQuantityOver999() {
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              List.of(
                  new CartItem(
                      "prod-1",
                      123456L,
                      "Product 1",
                      1000,
                      new BigDecimal("10.00"),
                      new BigDecimal("10000.00"))),
              List.of(),
              createValidTotals(),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream()
                              .anyMatch(
                                  e ->
                                      e.field().contains("quantity")
                                          && e.message().contains("between")))
          .verify();
    }

    @Test
    void shouldRejectItemWithZeroPrice() {
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              List.of(
                  new CartItem(
                      "prod-1", 123456L, "Product 1", 1, BigDecimal.ZERO, BigDecimal.ZERO)),
              List.of(),
              createValidTotals(),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream()
                              .anyMatch(
                                  e ->
                                      e.field().contains("unitPrice")
                                          && e.message().contains("greater than zero")))
          .verify();
    }

    @Test
    void shouldRejectItemWithNullPrice() {
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              List.of(new CartItem("prod-1", 123456L, "Product 1", 1, null, BigDecimal.ZERO)),
              List.of(),
              createValidTotals(),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream().anyMatch(e -> e.field().contains("unitPrice")))
          .verify();
    }

    @Test
    void shouldRejectItemWithNullSku() {
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              List.of(
                  new CartItem(
                      "prod-1",
                      null,
                      "Product 1",
                      1,
                      new BigDecimal("10.00"),
                      new BigDecimal("10.00"))),
              List.of(),
              createValidTotals(),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream().anyMatch(e -> e.field().contains("sku")))
          .verify();
    }

    @Test
    void shouldRejectItemWithZeroSku() {
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              List.of(
                  new CartItem(
                      "prod-1",
                      0L,
                      "Product 1",
                      1,
                      new BigDecimal("10.00"),
                      new BigDecimal("10.00"))),
              List.of(),
              createValidTotals(),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream()
                              .anyMatch(
                                  e -> e.field().contains("sku") && e.message().contains("Valid")))
          .verify();
    }
  }

  @Nested
  class TotalsValidationTests {

    @Test
    void shouldRejectCartWithNullTotals() {
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              List.of(createValidItem()),
              List.of(),
              null,
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream().anyMatch(e -> e.field().equals("cart.totals")))
          .verify();
    }

    @Test
    void shouldRejectCartWithZeroGrandTotal() {
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              List.of(createValidItem()),
              List.of(),
              new CartTotals(
                  new BigDecimal("10.00"),
                  new BigDecimal("10.00"),
                  BigDecimal.ZERO,
                  BigDecimal.ZERO,
                  BigDecimal.ZERO),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream()
                              .anyMatch(
                                  e ->
                                      e.field().equals("cart.totals.grandTotal")
                                          && e.message().contains("greater than zero")))
          .verify();
    }

    @Test
    void shouldRejectCartWithNullGrandTotal() {
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              List.of(createValidItem()),
              List.of(),
              new CartTotals(
                  new BigDecimal("10.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream()
                              .anyMatch(e -> e.field().equals("cart.totals.grandTotal")))
          .verify();
    }

    @Test
    void shouldRejectCartWithNegativeGrandTotal() {
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              List.of(createValidItem()),
              List.of(),
              new CartTotals(
                  new BigDecimal("10.00"),
                  BigDecimal.ZERO,
                  BigDecimal.ZERO,
                  BigDecimal.ZERO,
                  new BigDecimal("-5.00")),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error ->
                  error instanceof ValidationException
                      && ((ValidationException) error)
                          .getErrors().stream()
                              .anyMatch(
                                  e ->
                                      e.field().equals("cart.totals.grandTotal")
                                          && e.message().contains("greater than zero")))
          .verify();
    }
  }

  @Nested
  class MultipleErrorsTests {

    @Test
    void shouldCollectMultipleValidationErrors() {
      // Cart with multiple issues
      CartDetails cart =
          new CartDetails(
              "cart-123",
              200, // wrong store
              "customer-1",
              createCustomer(),
              List.of(
                  new CartItem("prod-1", 0L, "Product 1", 0, null, BigDecimal.ZERO)), // all invalid
              List.of(),
              new CartTotals(
                  BigDecimal.ZERO,
                  BigDecimal.ZERO,
                  BigDecimal.ZERO,
                  BigDecimal.ZERO,
                  BigDecimal.ZERO),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error -> {
                if (!(error instanceof ValidationException)) return false;
                var errors = ((ValidationException) error).getErrors();
                // Should have errors for: store number, quantity, price, sku, grand total
                return errors.size() >= 4;
              })
          .verify();
    }

    @Test
    void shouldValidateAllItemsAndCollectAllErrors() {
      // Two items with different errors
      CartDetails cart =
          new CartDetails(
              "cart-123",
              STORE_NUMBER,
              "customer-1",
              createCustomer(),
              List.of(
                  new CartItem(
                      "prod-1", 123456L, "Product 1", 0, new BigDecimal("10.00"), BigDecimal.ZERO),
                  new CartItem("prod-2", 789012L, "Product 2", 1, null, BigDecimal.ZERO)),
              List.of(),
              createValidTotals(),
              Instant.now(),
              Instant.now());

      StepVerifier.create(validator.validateForCheckout(cart, STORE_NUMBER))
          .expectErrorMatches(
              error -> {
                if (!(error instanceof ValidationException)) return false;
                var errors = ((ValidationException) error).getErrors();
                boolean hasItem0QuantityError =
                    errors.stream()
                        .anyMatch(
                            e -> e.field().contains("items[0]") && e.field().contains("quantity"));
                boolean hasItem1PriceError =
                    errors.stream()
                        .anyMatch(
                            e -> e.field().contains("items[1]") && e.field().contains("unitPrice"));
                return hasItem0QuantityError && hasItem1PriceError;
              })
          .verify();
    }
  }

  // ==================== Test Data Helpers ====================

  private CartDetails createValidCart() {
    return createValidCartForStore(STORE_NUMBER);
  }

  private CartDetails createValidCartForStore(int storeNumber) {
    return new CartDetails(
        "cart-123",
        storeNumber,
        "customer-1",
        createCustomer(),
        List.of(createValidItem()),
        List.of(),
        createValidTotals(),
        Instant.now(),
        Instant.now());
  }

  private CartCustomer createCustomer() {
    return new CartCustomer("customer-1", "John", "Doe", "john@example.com", "555-1234", "GOLD");
  }

  private CartItem createValidItem() {
    return new CartItem(
        "prod-1", 123456L, "Test Product", 2, new BigDecimal("25.00"), new BigDecimal("50.00"));
  }

  private CartTotals createValidTotals() {
    return new CartTotals(
        new BigDecimal("50.00"),
        BigDecimal.ZERO,
        new BigDecimal("4.00"),
        BigDecimal.ZERO,
        new BigDecimal("54.00"));
  }
}
