package org.example.platform.resilience;

import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadRegistry;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.reactor.bulkhead.operator.BulkheadOperator;
import io.github.resilience4j.reactor.circuitbreaker.operator.CircuitBreakerOperator;
import io.github.resilience4j.reactor.retry.RetryOperator;
import io.github.resilience4j.reactor.timelimiter.TimeLimiterOperator;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.timelimiter.TimeLimiter;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Wrapper component that applies Resilience4j decorators to reactive streams.
 *
 * <p>Order of decorators (innermost to outermost):
 *
 * <ol>
 *   <li>TimeLimiter - Timeout for the operation
 *   <li>CircuitBreaker - Fail fast when service is unavailable
 *   <li>Retry - Retry on transient failures
 *   <li>Bulkhead - Limit concurrent calls
 * </ol>
 */
@Component
public class ReactiveResilience {

  private final CircuitBreakerRegistry circuitBreakerRegistry;
  private final RetryRegistry retryRegistry;
  private final TimeLimiterRegistry timeLimiterRegistry;
  private final BulkheadRegistry bulkheadRegistry;

  public ReactiveResilience(
      CircuitBreakerRegistry circuitBreakerRegistry,
      RetryRegistry retryRegistry,
      TimeLimiterRegistry timeLimiterRegistry,
      BulkheadRegistry bulkheadRegistry) {
    this.circuitBreakerRegistry = circuitBreakerRegistry;
    this.retryRegistry = retryRegistry;
    this.timeLimiterRegistry = timeLimiterRegistry;
    this.bulkheadRegistry = bulkheadRegistry;
  }

  /**
   * Decorates a Mono with all resilience patterns.
   *
   * @param name The name of the resilience4j instances (must match config)
   * @param mono The Mono to decorate
   * @param <T> The type of the Mono
   * @return Decorated Mono with timeout, circuit breaker, retry, and bulkhead
   */
  public <T> Mono<T> decorate(String name, Mono<T> mono) {
    CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker(name);
    Retry retry = retryRegistry.retry(name);
    TimeLimiter timeLimiter = timeLimiterRegistry.timeLimiter(name);
    Bulkhead bulkhead = bulkheadRegistry.bulkhead(name);

    return mono.transformDeferred(TimeLimiterOperator.of(timeLimiter))
        .transformDeferred(CircuitBreakerOperator.of(circuitBreaker))
        .transformDeferred(RetryOperator.of(retry))
        .transformDeferred(BulkheadOperator.of(bulkhead));
  }

  /**
   * Gets the current state of a circuit breaker.
   *
   * @param name The name of the circuit breaker
   * @return The current state of the circuit breaker
   */
  public CircuitBreaker.State getCircuitBreakerState(String name) {
    return circuitBreakerRegistry.circuitBreaker(name).getState();
  }
}
