package org.example.checkout.event;

import org.example.platform.events.EventStreamProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configuration for checkout event publishing. */
@ConfigurationProperties(prefix = "checkout.events")
public class CheckoutEventProperties extends EventStreamProperties {

  private String source = "urn:reactive-platform:checkout-service";
  private String orderCompletedType = "org.example.checkout.OrderCompleted";

  public CheckoutEventProperties() {
    setStreamKey("orders:completed");
  }

  public String getSource() {
    return source;
  }

  public void setSource(String source) {
    this.source = source;
  }

  public String getOrderCompletedType() {
    return orderCompletedType;
  }

  public void setOrderCompletedType(String orderCompletedType) {
    this.orderCompletedType = orderCompletedType;
  }
}
