package org.example.checkout.repository;

import org.example.checkout.service.CheckoutService.CheckoutSession;
import reactor.core.publisher.Mono;

/** Repository for storing checkout sessions with TTL support. */
public interface CheckoutSessionRepository {

  /**
   * Save a checkout session with automatic expiration.
   *
   * @param session the session to save
   * @return Mono completing when saved
   */
  Mono<Void> save(CheckoutSession session);

  /**
   * Find a checkout session by ID.
   *
   * @param sessionId the session ID
   * @return Mono with session if found, empty otherwise
   */
  Mono<CheckoutSession> findById(String sessionId);

  /**
   * Delete a checkout session.
   *
   * @param sessionId the session ID
   * @return Mono completing when deleted
   */
  Mono<Void> deleteById(String sessionId);

  /**
   * Check if a session exists.
   *
   * @param sessionId the session ID
   * @return Mono with true if exists, false otherwise
   */
  Mono<Boolean> exists(String sessionId);
}
