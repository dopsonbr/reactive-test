package org.example.cart.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.test.context.support.WithMockUser;

class CartMutationControllerTest extends AbstractGraphQLIntegrationTest {

  @Test
  @WithMockUser(authorities = "SCOPE_cart:write")
  void shouldCreateCart() {
    graphQlTester
        .document(
            """
                mutation CreateCart($input: CreateCartInput!) {
                    createCart(input: $input) {
                        id
                        storeNumber
                        customerId
                        itemCount
                        totals {
                            grandTotal
                        }
                    }
                }
                """)
        .variable("input", Map.of("storeNumber", 100, "customerId", "cust-123"))
        .execute()
        .path("createCart.storeNumber")
        .entity(Integer.class)
        .isEqualTo(100)
        .path("createCart.customerId")
        .entity(String.class)
        .isEqualTo("cust-123")
        .path("createCart.itemCount")
        .entity(Integer.class)
        .isEqualTo(0)
        .path("createCart.totals.grandTotal")
        .entity(String.class)
        .isEqualTo("0.00");
  }

  @Test
  @WithMockUser(authorities = "SCOPE_cart:write")
  void shouldCreateCartWithoutCustomerId() {
    graphQlTester
        .document(
            """
                mutation {
                    createCart(input: { storeNumber: 200 }) {
                        id
                        storeNumber
                        customerId
                    }
                }
                """)
        .execute()
        .path("createCart.storeNumber")
        .entity(Integer.class)
        .isEqualTo(200)
        .path("createCart.customerId")
        .valueIsNull();
  }

  @Test
  @WithMockUser(authorities = "SCOPE_cart:write")
  void shouldValidateCreateCartInput() {
    graphQlTester
        .document(
            """
                mutation {
                    createCart(input: { storeNumber: 9999 }) {
                        id
                    }
                }
                """)
        .execute()
        .errors()
        .satisfy(
            errors -> {
              assertThat(errors).hasSize(1);
              assertThat(errors.get(0).getMessage()).contains("Validation failed");
              assertThat(errors.get(0).getExtensions()).containsKey("validationErrors");
            });
  }

  @Test
  @WithMockUser(authorities = "SCOPE_cart:write")
  void shouldDeleteCart() {
    // First create a cart
    String cartId =
        graphQlTester
            .document(
                """
                mutation {
                    createCart(input: { storeNumber: 100 }) {
                        id
                    }
                }
                """)
            .execute()
            .path("createCart.id")
            .entity(String.class)
            .get();

    // Then delete it
    graphQlTester
        .document(
            """
                mutation DeleteCart($id: ID!) {
                    deleteCart(id: $id)
                }
                """)
        .variable("id", cartId)
        .execute()
        .path("deleteCart")
        .entity(Boolean.class)
        .isEqualTo(true);
  }

  @Test
  @WithMockUser(authorities = {"SCOPE_cart:write", "SCOPE_cart:read"})
  void shouldSetAndRemoveCustomer() {
    // Create a cart
    String cartId =
        graphQlTester
            .document(
                """
                mutation {
                    createCart(input: { storeNumber: 100 }) {
                        id
                    }
                }
                """)
            .execute()
            .path("createCart.id")
            .entity(String.class)
            .get();

    // Set customer
    graphQlTester
        .document(
            """
                mutation SetCustomer($cartId: ID!, $input: SetCustomerInput!) {
                    setCustomer(cartId: $cartId, input: $input) {
                        id
                        customerId
                        customer {
                            customerId
                            name
                            email
                        }
                    }
                }
                """)
        .variable("cartId", cartId)
        .variable(
            "input",
            Map.of(
                "customerId", "cust-456",
                "name", "John Doe",
                "email", "john@example.com"))
        .execute()
        .path("setCustomer.customerId")
        .entity(String.class)
        .isEqualTo("cust-456")
        .path("setCustomer.customer.name")
        .entity(String.class)
        .isEqualTo("John Doe")
        .path("setCustomer.customer.email")
        .entity(String.class)
        .isEqualTo("john@example.com");

    // Remove customer
    graphQlTester
        .document(
            """
                mutation RemoveCustomer($cartId: ID!) {
                    removeCustomer(cartId: $cartId) {
                        id
                        customerId
                        customer {
                            customerId
                        }
                    }
                }
                """)
        .variable("cartId", cartId)
        .execute()
        .path("removeCustomer.customerId")
        .valueIsNull()
        .path("removeCustomer.customer")
        .valueIsNull();
  }

  @Test
  void shouldRejectUnauthenticatedRequest() {
    graphQlTester
        .document(
            """
                mutation {
                    createCart(input: { storeNumber: 100 }) {
                        id
                    }
                }
                """)
        .execute()
        .errors()
        .satisfy(
            errors ->
                assertThat(errors)
                    .anyMatch(
                        e ->
                            e.getMessage().contains("Access denied")
                                || e.getMessage().contains("Unauthorized")));
  }
}
