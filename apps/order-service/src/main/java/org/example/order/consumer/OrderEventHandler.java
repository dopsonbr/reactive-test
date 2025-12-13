package org.example.order.consumer;

import org.example.model.order.Order;
import org.example.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/** Handles OrderCompleted events by persisting orders to the database. */
@Component
public class OrderEventHandler {

  private static final Logger log = LoggerFactory.getLogger(OrderEventHandler.class);

  private final OrderRepository orderRepository;

  public OrderEventHandler(OrderRepository orderRepository) {
    this.orderRepository = orderRepository;
  }

  /**
   * Handle an OrderCompleted event.
   *
   * @param checkoutSessionId the checkout session ID
   * @param order the order to persist
   * @param eventId the event ID for logging
   * @return Mono completing when the order is persisted
   */
  public Mono<Void> handleOrderCompleted(String checkoutSessionId, Order order, String eventId) {
    return orderRepository
        .insertIfAbsent(order)
        .doOnSuccess(
            inserted -> {
              if (inserted) {
                log.info(
                    "Inserted order: orderId={}, orderNumber={}, checkoutSessionId={}, eventId={}",
                    order.id(),
                    order.orderNumber(),
                    checkoutSessionId,
                    eventId);
              } else {
                log.debug(
                    "Order already exists (idempotent): orderId={}, orderNumber={}, eventId={}",
                    order.id(),
                    order.orderNumber(),
                    eventId);
              }
            })
        .then();
  }
}
