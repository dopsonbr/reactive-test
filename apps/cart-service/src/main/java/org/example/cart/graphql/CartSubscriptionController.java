package org.example.cart.graphql;

import org.example.cart.event.CartEvent;
import org.example.cart.graphql.validation.GraphQLInputValidator;
import org.example.cart.pubsub.CartEventSubscriber;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.SubscriptionMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;

/**
 * GraphQL subscription resolver for real-time cart updates.
 *
 * <p>Uses Redis Pub/Sub for cross-instance event fan-out. SSE transport is used by default (no
 * WebSocket configuration needed).
 *
 * <p>Client connection via SSE:
 *
 * <pre>
 * GET /graphql?query=subscription{cartUpdated(cartId:"...")}
 * Accept: text/event-stream
 * Authorization: Bearer &lt;token&gt;
 * </pre>
 */
@Controller
public class CartSubscriptionController {

  private final CartEventSubscriber eventSubscriber;
  private final GraphQLInputValidator validator;

  public CartSubscriptionController(
      CartEventSubscriber eventSubscriber, GraphQLInputValidator validator) {
    this.eventSubscriber = eventSubscriber;
    this.validator = validator;
  }

  /**
   * Subscribe to updates for a specific cart.
   *
   * @param cartId the cart ID to subscribe to
   * @return Flux of cart events
   */
  @SubscriptionMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:read')")
  public Flux<CartEvent> cartUpdated(@Argument String cartId) {
    return validator.validateCartId(cartId).thenMany(eventSubscriber.subscribe(cartId));
  }

  /**
   * Subscribe to all cart events for a store (admin use).
   *
   * @param storeNumber the store number
   * @return Flux of cart events for all carts in the store
   */
  @SubscriptionMapping
  @PreAuthorize("hasAuthority('SCOPE_cart:admin')")
  public Flux<CartEvent> storeCartEvents(@Argument int storeNumber) {
    return validator
        .validateStoreNumber(storeNumber)
        .thenMany(eventSubscriber.subscribeToStore(storeNumber));
  }
}
