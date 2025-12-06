package org.example.order;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

/** Basic smoke test to verify the application context loads. */
@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext
class OrderServiceApplicationTest extends AbstractIntegrationTest {

  @Test
  void contextLoads() {
    // Verifies the Spring application context loads successfully
  }
}
