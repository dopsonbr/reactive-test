package org.example.order;

import org.example.order.consumer.OrderEventProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication(
    scanBasePackages = {
      "org.example.order",
      "org.example.platform.logging",
      "org.example.platform.error",
      "org.example.platform.security"
    })
@EnableConfigurationProperties(OrderEventProperties.class)
public class OrderServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(OrderServiceApplication.class, args);
  }
}
