package org.example.cart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
    scanBasePackages = {
      "org.example.cart",
      "org.example.platform.logging",
      "org.example.platform.resilience",
      "org.example.platform.error",
      "org.example.platform.security"
    })
public class CartServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(CartServiceApplication.class, args);
  }
}
