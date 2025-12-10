package org.example.cart.graphql;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.security.test.context.support.WithMockUser;

/**
 * Integration tests for GraphQL subscription schema validation.
 *
 * <p>Note: Full subscription flux testing is covered by {@link
 * org.example.cart.pubsub.CartEventPubSubTest} which tests the Redis pub/sub layer directly. SSE
 * transport testing is not fully supported by Spring GraphQL test framework.
 *
 * <p>This test class focuses on:
 *
 * <ul>
 *   <li>Subscription schema validation (correct field requests compile)
 *   <li>Subscription argument types (cartId, storeNumber schema compliance)
 * </ul>
 *
 * <p>For full E2E subscription testing with SSE transport, authorization, and real-time events, see
 * the Playwright E2E tests in e2e/ecommerce-fullstack/.
 *
 * <p>Note: Subscription execution via HttpGraphQlTester doesn't actually start the reactive
 * subscription chain, so validation errors and authorization checks don't propagate the same way as
 * queries/mutations. Those behaviors are tested via:
 *
 * <ul>
 *   <li>Unit tests for GraphQLInputValidator (validation logic)
 *   <li>CartEventPubSubTest (pub/sub behavior)
 *   <li>E2E tests (full SSE transport with real auth)
 * </ul>
 */
class CartSubscriptionControllerTest extends AbstractGraphQLIntegrationTest {

  @Test
  @WithMockUser(authorities = "SCOPE_cart:read")
  void shouldAcceptValidCartIdFormat() {
    // Valid UUID should compile against schema and return no schema errors
    // Note: This validates schema compliance, not runtime validation
    graphQlTester
        .document(
            """
            subscription {
                cartUpdated(cartId: "550e8400-e29b-41d4-a716-446655440000") {
                    eventType
                    cartId
                }
            }
            """)
        .execute()
        .errors()
        .verify(); // No schema errors expected for valid input
  }

  @Test
  @WithMockUser(authorities = "SCOPE_cart:admin")
  void shouldAcceptValidStoreNumber() {
    // Valid store number should compile against schema
    graphQlTester
        .document(
            """
            subscription {
                storeCartEvents(storeNumber: 100) {
                    eventType
                    cartId
                }
            }
            """)
        .execute()
        .errors()
        .verify(); // No schema errors expected for valid input
  }

  @Test
  @WithMockUser(authorities = "SCOPE_cart:read")
  void shouldAllowRequestingAllEventFields() {
    // Verify all CartEvent fields are accessible in subscription response
    // CartEvent has: eventType, cartId, cart, timestamp (see schema.graphqls)
    graphQlTester
        .document(
            """
            subscription {
                cartUpdated(cartId: "550e8400-e29b-41d4-a716-446655440000") {
                    eventType
                    cartId
                    timestamp
                    cart {
                        id
                        storeNumber
                        itemCount
                    }
                }
            }
            """)
        .execute()
        .errors()
        .verify();
  }

  @Test
  @WithMockUser(authorities = "SCOPE_cart:admin")
  void shouldAllowRequestingAllFieldsForStoreEvents() {
    // Verify storeCartEvents subscription schema
    graphQlTester
        .document(
            """
            subscription {
                storeCartEvents(storeNumber: 100) {
                    eventType
                    cartId
                    timestamp
                    cart {
                        id
                        storeNumber
                        itemCount
                    }
                }
            }
            """)
        .execute()
        .errors()
        .verify();
  }

  @Test
  @WithMockUser(authorities = "SCOPE_cart:read")
  void shouldRejectInvalidFieldInSubscription() {
    // Test schema validation catches invalid field requests
    graphQlTester
        .document(
            """
            subscription {
                cartUpdated(cartId: "550e8400-e29b-41d4-a716-446655440000") {
                    eventType
                    nonExistentField
                }
            }
            """)
        .execute()
        .errors()
        .satisfy(
            errors -> {
              assertThat(errors).hasSizeGreaterThanOrEqualTo(1);
              assertThat(errors.get(0).getMessage()).containsIgnoringCase("nonExistentField");
            });
  }

  @Test
  @WithMockUser(authorities = "SCOPE_cart:read")
  void shouldRejectMissingRequiredArgument() {
    // cartId is required - schema validation should catch this
    graphQlTester
        .document(
            """
            subscription {
                cartUpdated {
                    eventType
                }
            }
            """)
        .execute()
        .errors()
        .satisfy(
            errors -> {
              assertThat(errors).hasSizeGreaterThanOrEqualTo(1);
              assertThat(errors.get(0).getMessage()).containsIgnoringCase("cartId");
            });
  }
}
