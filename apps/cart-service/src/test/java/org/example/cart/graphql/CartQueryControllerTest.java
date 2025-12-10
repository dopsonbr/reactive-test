package org.example.cart.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.test.context.support.WithMockUser;

class CartQueryControllerTest extends AbstractGraphQLIntegrationTest {

  @Test
  @WithMockUser(authorities = {"SCOPE_cart:read", "SCOPE_cart:write"})
  void shouldGetCartById() {
    // Given: create a cart first via mutation
    String cartId = createTestCart(100);

    // When/Then
    graphQlTester
        .document(
            """
            query GetCart($id: ID!) {
                cart(id: $id) {
                    id
                    storeNumber
                    totals {
                        grandTotal
                    }
                    itemCount
                }
            }
            """)
        .variable("id", cartId)
        .execute()
        .path("cart.id")
        .entity(String.class)
        .isEqualTo(cartId)
        .path("cart.storeNumber")
        .entity(Integer.class)
        .isEqualTo(100)
        .path("cart.itemCount")
        .entity(Integer.class)
        .isEqualTo(0);
  }

  @Test
  @WithMockUser(authorities = "SCOPE_cart:read")
  void shouldReturnNullForNonExistentCart() {
    graphQlTester
        .document(
            """
            query GetCart($id: ID!) {
                cart(id: $id) {
                    id
                }
            }
            """)
        .variable("id", "550e8400-e29b-41d4-a716-446655440000")
        .execute()
        .path("cart")
        .valueIsNull();
  }

  @Test
  @WithMockUser(authorities = {"SCOPE_cart:read", "SCOPE_cart:write"})
  void shouldGetCartsByStore() {
    // Create carts in store 150
    createTestCart(150);
    createTestCart(150);

    graphQlTester
        .document(
            """
            query CartsByStore($storeNumber: Int!) {
                cartsByStore(storeNumber: $storeNumber) {
                    id
                    storeNumber
                }
            }
            """)
        .variable("storeNumber", 150)
        .execute()
        .path("cartsByStore")
        .entityList(Object.class)
        .satisfies(list -> assertThat(list).hasSizeGreaterThanOrEqualTo(2));
  }

  @Test
  @WithMockUser(authorities = {"SCOPE_cart:read", "SCOPE_cart:write"})
  void shouldGetCartsByCustomer() {
    // Create cart with customer
    String cartId =
        graphQlTester
            .document(
                """
                mutation {
                    createCart(input: { storeNumber: 100, customerId: "test-customer-query" }) {
                        id
                    }
                }
                """)
            .execute()
            .path("createCart.id")
            .entity(String.class)
            .get();

    graphQlTester
        .document(
            """
            query CartsByCustomer($customerId: String!) {
                cartsByCustomer(customerId: $customerId) {
                    id
                    customerId
                }
            }
            """)
        .variable("customerId", "test-customer-query")
        .execute()
        .path("cartsByCustomer")
        .entityList(Object.class)
        .satisfies(list -> assertThat(list).hasSizeGreaterThanOrEqualTo(1));

    // Verify customer ID in first result
    graphQlTester
        .document(
            """
            query CartsByCustomer($customerId: String!) {
                cartsByCustomer(customerId: $customerId) {
                    customerId
                }
            }
            """)
        .variable("customerId", "test-customer-query")
        .execute()
        .path("cartsByCustomer[0].customerId")
        .entity(String.class)
        .isEqualTo("test-customer-query");
  }

  @Test
  @WithMockUser(authorities = "SCOPE_cart:read")
  void shouldValidateCartIdFormat() {
    graphQlTester
        .document(
            """
            query {
                cart(id: "not-a-uuid") {
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
            });
  }

  @Test
  @WithMockUser(authorities = "SCOPE_cart:read")
  void shouldValidateStoreNumber() {
    graphQlTester
        .document(
            """
            query {
                cartsByStore(storeNumber: 9999) {
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
            });
  }

  // Note: Authentication tests are in CartControllerSecurityTest
  // This test class has security disabled (app.security.enabled=false) to focus on GraphQL
  // functionality

  @Test
  @WithMockUser(authorities = {"SCOPE_cart:read", "SCOPE_cart:write"})
  void shouldGetCartWithFullDetails() {
    String cartId = createTestCart(100);

    // Set customer
    graphQlTester
        .document(
            """
            mutation SetCustomer($cartId: ID!, $input: SetCustomerInput!) {
                setCustomer(cartId: $cartId, input: $input) {
                    id
                }
            }
            """)
        .variable("cartId", cartId)
        .variable(
            "input",
            Map.of(
                "customerId", "cust-full-details",
                "name", "Test User",
                "email", "test@example.com"))
        .execute();

    // Query full cart details
    graphQlTester
        .document(
            """
            query GetCartFull($id: ID!) {
                cart(id: $id) {
                    id
                    storeNumber
                    customerId
                    customer {
                        customerId
                        name
                        email
                    }
                    products {
                        sku
                        quantity
                    }
                    discounts {
                        discountId
                        code
                    }
                    fulfillments {
                        fulfillmentId
                        type
                    }
                    totals {
                        subtotal
                        discountTotal
                        fulfillmentTotal
                        grandTotal
                    }
                    itemCount
                    createdAt
                    updatedAt
                }
            }
            """)
        .variable("id", cartId)
        .execute()
        .path("cart.id")
        .entity(String.class)
        .isEqualTo(cartId)
        .path("cart.customer.name")
        .entity(String.class)
        .isEqualTo("Test User")
        .path("cart.products")
        .entityList(Object.class)
        .hasSize(0)
        .path("cart.discounts")
        .entityList(Object.class)
        .hasSize(0)
        .path("cart.fulfillments")
        .entityList(Object.class)
        .hasSize(0);
  }

  private String createTestCart(int storeNumber) {
    return graphQlTester
        .document(
            """
            mutation CreateCart($storeNumber: Int!) {
                createCart(input: { storeNumber: $storeNumber }) {
                    id
                }
            }
            """)
        .variable("storeNumber", storeNumber)
        .execute()
        .path("createCart.id")
        .entity(String.class)
        .get();
  }
}
