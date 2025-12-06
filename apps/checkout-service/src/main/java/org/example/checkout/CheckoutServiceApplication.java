package org.example.checkout;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
    scanBasePackages = {
      "org.example.checkout",
      "org.example.platform.logging",
      "org.example.platform.resilience",
      "org.example.platform.error",
      "org.example.platform.security"
    })
public class CheckoutServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(CheckoutServiceApplication.class, args);
  }
}
