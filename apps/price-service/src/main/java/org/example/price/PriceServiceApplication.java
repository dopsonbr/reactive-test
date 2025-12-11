package org.example.price;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
    scanBasePackages = {
      "org.example.price",
      "org.example.platform.logging",
      "org.example.platform.error",
      "org.example.platform.security"
    })
public class PriceServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(PriceServiceApplication.class, args);
  }
}
