package org.example.merchandise;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
    scanBasePackages = {
      "org.example.merchandise",
      "org.example.platform.logging",
      "org.example.platform.error",
      "org.example.platform.security"
    })
public class MerchandiseServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(MerchandiseServiceApplication.class, args);
  }
}
