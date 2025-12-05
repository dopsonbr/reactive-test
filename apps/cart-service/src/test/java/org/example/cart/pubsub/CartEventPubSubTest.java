package org.example.cart.pubsub;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.example.cart.event.CartEvent;
import org.example.cart.event.CartEventType;
import org.example.cart.model.Cart;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@WithMockUser(authorities = {"SCOPE_cart:read", "SCOPE_cart:write"})
class CartEventPubSubTest extends AbstractPubSubTest {

  @Autowired private CartEventPublisher publisher;

  @Autowired private CartEventSubscriber subscriber;

  @Test
  void shouldPublishAndReceiveCartEvent() {
    String cartId = "test-cart-" + System.currentTimeMillis();
    Cart cart = Cart.create(cartId, 100, null);
    CartEvent event = CartEvent.of(CartEventType.CART_CREATED, cart);

    StepVerifier.create(
            subscriber
                .subscribe(cartId)
                .doOnSubscribe(
                    s ->
                        // Publish after subscription established with delay to ensure listener is
                        // ready
                        Mono.delay(Duration.ofMillis(100))
                            .then(publisher.publish(event))
                            .subscribe())
                .take(1)
                .timeout(Duration.ofSeconds(5)))
        .assertNext(
            received -> {
              assertThat(received.eventType()).isEqualTo(CartEventType.CART_CREATED);
              assertThat(received.cartId()).isEqualTo(cartId);
              assertThat(received.cart().storeNumber()).isEqualTo(100);
            })
        .verifyComplete();
  }

  @Test
  void shouldPublishToStoreChannel() {
    int storeNumber = 42;
    String cartId = "test-cart-" + System.currentTimeMillis();
    Cart cart = Cart.create(cartId, storeNumber, null);
    CartEvent event = CartEvent.of(CartEventType.PRODUCT_ADDED, cart);

    StepVerifier.create(
            subscriber
                .subscribeToStore(storeNumber)
                .doOnSubscribe(
                    s ->
                        // Delay to ensure listener is ready
                        Mono.delay(Duration.ofMillis(100))
                            .then(publisher.publishToStore(event, storeNumber))
                            .subscribe())
                .take(1)
                .timeout(Duration.ofSeconds(5)))
        .assertNext(
            received -> {
              assertThat(received.eventType()).isEqualTo(CartEventType.PRODUCT_ADDED);
              assertThat(received.cartId()).isEqualTo(cartId);
            })
        .verifyComplete();
  }

  @Test
  void shouldNotReceiveEventsForOtherCarts() {
    String cartId1 = "cart-1-" + System.currentTimeMillis();
    String cartId2 = "cart-2-" + System.currentTimeMillis();
    Cart cart2 = Cart.create(cartId2, 100, null);
    CartEvent event = CartEvent.of(CartEventType.CART_CREATED, cart2);

    // Subscribe to cart-1, publish to cart-2 - should timeout
    StepVerifier.create(
            subscriber
                .subscribe(cartId1)
                .doOnSubscribe(
                    s ->
                        // Delay to ensure listener is ready before publishing
                        Mono.delay(Duration.ofMillis(100))
                            .then(publisher.publish(event))
                            .subscribe())
                .take(1)
                .timeout(Duration.ofMillis(500)))
        .expectTimeout(Duration.ofMillis(500))
        .verify();
  }
}
