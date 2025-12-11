package org.example.discount.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.example.discount.controller.dto.ApplyMarkdownRequest;
import org.example.discount.controller.dto.MarkdownOverrideRequest;
import org.example.discount.controller.dto.MarkdownOverrideResponse;
import org.example.discount.domain.UserContext;
import org.example.discount.exception.UnauthorizedMarkdownException;
import org.example.discount.repository.MarkdownRepository;
import org.example.discount.repository.user.UserRepository;
import org.example.model.discount.Markdown;
import org.example.model.discount.MarkdownPermissionTier;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Service for employee markdown operations. */
@Service
public class MarkdownService {

  private final MarkdownRepository repository;
  private final UserRepository userRepository;

  public MarkdownService(MarkdownRepository repository, UserRepository userRepository) {
    this.repository = repository;
    this.userRepository = userRepository;
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
    return userRepository
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

  /**
   * Apply a markdown with manager override authorization.
   *
   * @param request the override request with manager credentials
   * @return the override response
   */
  public Mono<MarkdownOverrideResponse> applyWithOverride(MarkdownOverrideRequest request) {
    return validateManagerCredentials(request.managerId(), request.managerPin())
        .flatMap(
            managerContext -> {
              // Verify manager has sufficient tier for this markdown
              MarkdownPermissionTier managerTier = getPermissionTier(managerContext);
              if (!managerTier.canAuthorize(request.type(), request.reason())) {
                return Mono.just(
                    MarkdownOverrideResponse.failure(
                        "Manager tier " + managerTier + " cannot authorize this markdown"));
              }
              if (!managerTier.isWithinLimit(request.type(), request.value())) {
                return Mono.just(
                    MarkdownOverrideResponse.failure("Markdown value exceeds manager's authority"));
              }

              // Parse SKU as Long if present
              Long skuLong = null;
              if (request.sku() != null) {
                try {
                  skuLong = Long.parseLong(request.sku());
                } catch (NumberFormatException e) {
                  return Mono.just(MarkdownOverrideResponse.failure("Invalid SKU format"));
                }
              }

              // Create the markdown with the manager as authorizer
              Markdown markdown =
                  new Markdown(
                      UUID.randomUUID().toString(),
                      managerContext.storeNumber() != null ? managerContext.storeNumber() : 0,
                      skuLong,
                      request.type(),
                      request.value(),
                      request.reason(),
                      request.requestingUserId(),
                      null, // Customer ID
                      request.cartId(),
                      Instant.now(),
                      Instant.now().plus(4, ChronoUnit.HOURS));

              return repository
                  .save(markdown)
                  .map(
                      saved ->
                          MarkdownOverrideResponse.success(
                              saved, request.managerId(), managerContext.displayName()));
            })
        .onErrorResume(
            UnauthorizedMarkdownException.class,
            e -> Mono.just(MarkdownOverrideResponse.failure(e.getMessage())));
  }

  /**
   * Get the markdown permission tier for a user.
   *
   * @param userId the user ID
   * @return the user's permission tier
   */
  public Mono<MarkdownPermissionTier> getUserPermissionTier(String userId) {
    return userRepository
        .getUser(userId)
        .map(this::getPermissionTier)
        .defaultIfEmpty(MarkdownPermissionTier.ASSOCIATE);
  }

  private Mono<UserContext> validateManagerCredentials(String managerId, String pin) {
    return userRepository
        .getUser(managerId)
        .filter(user -> user.validatePin(pin))
        .filter(
            user ->
                getPermissionTier(user).ordinal() >= MarkdownPermissionTier.SUPERVISOR.ordinal())
        .switchIfEmpty(
            Mono.error(new UnauthorizedMarkdownException("Invalid manager credentials")));
  }

  private MarkdownPermissionTier getPermissionTier(UserContext user) {
    if (user == null) {
      return MarkdownPermissionTier.ASSOCIATE;
    }
    // Map user role to permission tier
    return switch (user.role()) {
      case "ADMIN" -> MarkdownPermissionTier.ADMIN;
      case "MANAGER" -> MarkdownPermissionTier.MANAGER;
      case "SUPERVISOR" -> MarkdownPermissionTier.SUPERVISOR;
      default -> MarkdownPermissionTier.ASSOCIATE;
    };
  }
}
