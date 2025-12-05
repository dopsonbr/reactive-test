package org.example.audit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(
    scanBasePackages = {
      "org.example.audit",
      "org.example.platform.logging",
      "org.example.platform.resilience",
      "org.example.platform.error"
    })
@EnableScheduling
public class AuditServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(AuditServiceApplication.class, args);
  }
}
