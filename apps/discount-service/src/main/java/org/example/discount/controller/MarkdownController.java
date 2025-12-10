package org.example.discount.controller;

import org.example.discount.controller.dto.ApplyMarkdownRequest;
import org.example.discount.controller.dto.MarkdownOverrideRequest;
import org.example.discount.controller.dto.MarkdownOverrideResponse;
import org.example.discount.exception.UnauthorizedMarkdownException;
import org.example.discount.service.MarkdownService;
import org.example.discount.validation.DiscountRequestValidator;
import org.example.model.discount.Markdown;
import org.example.model.discount.MarkdownLimit;
import org.example.model.discount.MarkdownPermissionTier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Controller for employee markdown operations. Employee-only endpoints. */
@RestController
@RequestMapping("/markdowns")
public class MarkdownController {

  private final MarkdownService markdownService;
  private final DiscountRequestValidator validator;

  public MarkdownController(MarkdownService markdownService, DiscountRequestValidator validator) {
    this.markdownService = markdownService;
    this.validator = validator;
  }

  /**
   * Apply a markdown to a cart (employee only).
   *
   * @param request the markdown request
   * @param userId the user ID from header
   * @return the applied markdown
   */
  @PostMapping
  public Mono<ResponseEntity<Markdown>> applyMarkdown(
      @RequestBody ApplyMarkdownRequest request, @RequestHeader("x-userid") String userId) {

    return validator
        .validateApplyMarkdown(request, userId)
        .then(markdownService.applyMarkdown(request, userId))
        .map(ResponseEntity::ok)
        .onErrorResume(
            UnauthorizedMarkdownException.class,
            e -> Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build()));
  }

  /**
   * Get all active markdowns for a cart.
   *
   * @param cartId the cart ID
   * @return stream of active markdowns
   */
  @GetMapping("/cart/{cartId}")
  public Flux<Markdown> getMarkdownsForCart(@PathVariable String cartId) {
    return validator.validateCartId(cartId).thenMany(markdownService.getMarkdownsForCart(cartId));
  }

  /**
   * Get a markdown by ID.
   *
   * @param id the markdown ID
   * @return the markdown if found
   */
  @GetMapping("/{id}")
  public Mono<ResponseEntity<Markdown>> getMarkdown(@PathVariable String id) {
    return validator
        .validateMarkdownId(id)
        .then(markdownService.findById(id))
        .map(ResponseEntity::ok)
        .defaultIfEmpty(ResponseEntity.notFound().build());
  }

  /**
   * Void/cancel a markdown (employee only).
   *
   * @param id the markdown ID
   * @param userId the user ID from header
   * @return no content on success
   */
  @DeleteMapping("/{id}")
  public Mono<ResponseEntity<Void>> voidMarkdown(
      @PathVariable String id, @RequestHeader("x-userid") String userId) {

    return validator
        .validateVoidMarkdown(id, userId)
        .then(markdownService.voidMarkdown(id, userId))
        .then(Mono.just(ResponseEntity.noContent().<Void>build()))
        .onErrorResume(
            UnauthorizedMarkdownException.class,
            e -> Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build()));
  }

  /**
   * Apply a markdown with manager override authorization. Used when the requesting user's
   * permission tier is insufficient for the requested markdown.
   *
   * @param request the override request including manager credentials
   * @return the override response with the applied markdown or error
   */
  @PostMapping("/override")
  public Mono<ResponseEntity<MarkdownOverrideResponse>> applyWithOverride(
      @RequestBody MarkdownOverrideRequest request) {

    return markdownService
        .applyWithOverride(request)
        .map(ResponseEntity::ok)
        .onErrorResume(
            UnauthorizedMarkdownException.class,
            e -> Mono.just(ResponseEntity.ok(MarkdownOverrideResponse.failure(e.getMessage()))));
  }

  /**
   * Get the markdown limits for a specific user based on their permission tier.
   *
   * @param userId the user ID
   * @return the user's markdown limits
   */
  @GetMapping("/limits/{userId}")
  public Mono<MarkdownLimit> getUserMarkdownLimits(@PathVariable String userId) {
    return markdownService
        .getUserPermissionTier(userId)
        .map(MarkdownLimit::fromTier)
        .defaultIfEmpty(MarkdownLimit.fromTier(MarkdownPermissionTier.ASSOCIATE));
  }
}
