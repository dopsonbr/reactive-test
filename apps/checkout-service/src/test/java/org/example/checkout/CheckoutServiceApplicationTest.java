package org.example.checkout;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Basic smoke test to verify the application context loads. */
@SpringBootTest
@ActiveProfiles("test")
class CheckoutServiceApplicationTest extends AbstractIntegrationTest {

  @Test
  void contextLoads() {
    // Application context should load successfully
  }
}
