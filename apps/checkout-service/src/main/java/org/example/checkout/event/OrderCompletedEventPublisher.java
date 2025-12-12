package org.example.checkout.event;

import io.cloudevents.CloudEvent;
import java.net.URI;
import org.example.model.order.Order;
import org.example.platform.events.CloudEventPublisher;
import org.example.platform.events.CloudEventSerializer;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/** Publishes OrderCompleted events to Redis Streams. */
@Component
public class OrderCompletedEventPublisher {

  private final CloudEventPublisher cloudEventPublisher;
  private final CloudEventSerializer serializer;
  private final CheckoutEventProperties properties;

  public OrderCompletedEventPublisher(
      CloudEventPublisher cloudEventPublisher,
      CloudEventSerializer serializer,
      CheckoutEventProperties properties) {
    this.cloudEventPublisher = cloudEventPublisher;
    this.serializer = serializer;
    this.properties = properties;
  }

  /**
   * Publish an OrderCompleted event.
   *
   * @param order the completed order
   * @param checkoutSessionId the checkout session ID
   * @return Mono with the record ID
   */
  public Mono<String> publishOrderCompleted(Order order, String checkoutSessionId) {
    OrderCompletedEventData data = new OrderCompletedEventData(checkoutSessionId, order);

    CloudEvent event =
        serializer.buildEvent(
            properties.getOrderCompletedType(),
            URI.create(properties.getSource()),
            order.id().toString(),
            data);

    return cloudEventPublisher.publishAndAwait(event);
  }

  /** Event data for OrderCompleted. */
  public record OrderCompletedEventData(String checkoutSessionId, Order order) {}
}
