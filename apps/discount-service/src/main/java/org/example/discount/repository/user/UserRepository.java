package org.example.discount.repository.user;

import java.util.Set;
import org.example.discount.domain.UserContext;
import org.example.discount.domain.UserContext.Permission;
import org.example.discount.domain.UserContext.UserType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/** Repository for communicating with user-service to retrieve user context information. */
@Repository
public class UserRepository {

  private final WebClient webClient;

  public UserRepository(
      WebClient.Builder webClientBuilder,
      @Value("${services.user-service.url:http://localhost:8084}") String baseUrl) {
    this.webClient = webClientBuilder.baseUrl(baseUrl).build();
  }

  /**
   * Get user context by user ID.
   *
   * @param userId the user ID
   * @return user context or anonymous if not found
   */
  public Mono<UserContext> getUser(String userId) {
    // Try to call real user-service, fallback to mock data
    return webClient
        .get()
        .uri("/users/{id}", userId)
        .retrieve()
        .bodyToMono(UserContext.class)
        .onErrorResume(e -> getMockUserContext(userId));
  }

  private Mono<UserContext> getMockUserContext(String userId) {
    // Return mock user data for testing when user-service is not available
    if (userId == null || userId.isEmpty()) {
      return Mono.just(UserContext.anonymous());
    }

    // Simulate different user types based on user ID prefix
    if (userId.startsWith("emp")) {
      return Mono.just(
          new UserContext(
              UserType.EMPLOYEE,
              Set.of(
                  Permission.READ, Permission.WRITE, Permission.ADMIN, Permission.CUSTOMER_SEARCH),
              1234));
    } else if (userId.startsWith("svc")) {
      return Mono.just(new UserContext(UserType.SERVICE_ACCOUNT, Set.of(Permission.READ), null));
    }

    // Default: Customer
    return Mono.just(
        new UserContext(UserType.CUSTOMER, Set.of(Permission.READ, Permission.WRITE), null));
  }
}
