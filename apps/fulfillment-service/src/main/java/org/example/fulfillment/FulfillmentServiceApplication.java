package org.example.fulfillment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
    scanBasePackages = {
      "org.example.fulfillment",
      "org.example.platform.logging",
      "org.example.platform.error"
    })
public class FulfillmentServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(FulfillmentServiceApplication.class, args);
  }
}
