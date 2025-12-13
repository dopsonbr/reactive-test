package org.example.order.consumer;

import org.example.platform.events.EventStreamProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configuration for order event consumption. */
@ConfigurationProperties(prefix = "order.consumer")
public class OrderEventProperties extends EventStreamProperties {

  private String orderCompletedType = "org.example.checkout.OrderCompleted";

  public OrderEventProperties() {
    setStreamKey("orders:completed");
    setConsumerGroup("order-service");
  }

  public String getOrderCompletedType() {
    return orderCompletedType;
  }

  public void setOrderCompletedType(String orderCompletedType) {
    this.orderCompletedType = orderCompletedType;
  }
}
