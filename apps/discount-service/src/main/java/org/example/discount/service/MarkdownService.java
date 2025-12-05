package org.example.discount.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.example.discount.client.UserContext;
import org.example.discount.client.UserServiceClient;
import org.example.discount.controller.dto.ApplyMarkdownRequest;
import org.example.discount.exception.UnauthorizedMarkdownException;
import org.example.discount.repository.MarkdownRepository;
import org.example.model.discount.Markdown;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Service for employee markdown operations. */
@Service
public class MarkdownService {

  private final MarkdownRepository repository;
  private final UserServiceClient userClient;

  public MarkdownService(MarkdownRepository repository, UserServiceClient userClient) {
    this.repository = repository;
    this.userClient = userClient;
  }

  /**
   * Apply a markdown (employee only).
   *
   * @param request the markdown request
   * @param userId the user ID applying the markdown
   * @return the applied markdown
   * @throws UnauthorizedMarkdownException if user is not authorized
   */
  public Mono<Markdown> applyMarkdown(ApplyMarkdownRequest request, String userId) {
    return validateEmployeePermission(userId).then(createMarkdown(request, userId));
  }

  private Mono<Void> validateEmployeePermission(String userId) {
    return userClient
        .getUser(userId)
        .filter(UserContext::canApplyMarkdown)
        .switchIfEmpty(
            Mono.error(
                new UnauthorizedMarkdownException(
                    "Markdown requires EMPLOYEE user with ADMIN permission")))
        .then();
  }

  private Mono<Markdown> createMarkdown(ApplyMarkdownRequest request, String userId) {
    Markdown markdown =
        new Markdown(
            UUID.randomUUID().toString(),
            request.storeNumber(),
            request.sku(),
            request.type(),
            request.value(),
            request.reason(),
            userId,
            request.customerId(),
            request.cartId(),
            Instant.now(),
            Instant.now().plus(4, ChronoUnit.HOURS)); // 4-hour session expiry
    return repository.save(markdown);
  }

  /**
   * Void/cancel a markdown (employee only).
   *
   * @param markdownId the markdown ID
   * @param userId the user ID voiding the markdown
   * @return completion signal
   * @throws UnauthorizedMarkdownException if user is not authorized
   */
  public Mono<Void> voidMarkdown(String markdownId, String userId) {
    return validateEmployeePermission(userId).then(repository.delete(markdownId));
  }

  /**
   * Get all active markdowns for a cart.
   *
   * @param cartId the cart ID
   * @return stream of active markdowns
   */
  public Flux<Markdown> getMarkdownsForCart(String cartId) {
    return repository.findActiveByCart(cartId);
  }

  /**
   * Find a markdown by ID.
   *
   * @param markdownId the markdown ID
   * @return the markdown if found
   */
  public Mono<Markdown> findById(String markdownId) {
    return repository.findById(markdownId);
  }
}
