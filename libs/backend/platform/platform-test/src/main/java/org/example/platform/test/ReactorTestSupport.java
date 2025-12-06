package org.example.platform.test;

import java.time.Duration;
import java.util.function.Predicate;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/** Support class for testing reactive streams with StepVerifier. */
public final class ReactorTestSupport {

  private static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(10);

  private ReactorTestSupport() {}

  /**
   * Verify that a Mono completes with the expected value.
   *
   * @param mono the Mono to verify
   * @param expected the expected value
   * @param <T> the type of the value
   */
  public static <T> void verifyMono(Mono<T> mono, T expected) {
    StepVerifier.create(mono).expectNext(expected).verifyComplete();
  }

  /**
   * Verify that a Mono completes with a value matching the predicate.
   *
   * @param mono the Mono to verify
   * @param predicate the predicate to match
   * @param <T> the type of the value
   */
  public static <T> void verifyMono(Mono<T> mono, Predicate<T> predicate) {
    StepVerifier.create(mono).expectNextMatches(predicate).verifyComplete();
  }

  /**
   * Verify that a Mono completes empty.
   *
   * @param mono the Mono to verify
   * @param <T> the type of the value
   */
  public static <T> void verifyEmpty(Mono<T> mono) {
    StepVerifier.create(mono).verifyComplete();
  }

  /**
   * Verify that a Mono fails with the expected exception type.
   *
   * @param mono the Mono to verify
   * @param exceptionType the expected exception class
   * @param <T> the type of the value
   */
  public static <T> void verifyError(Mono<T> mono, Class<? extends Throwable> exceptionType) {
    StepVerifier.create(mono).verifyError(exceptionType);
  }

  /**
   * Verify a Mono with a custom timeout.
   *
   * @param mono the Mono to verify
   * @param expected the expected value
   * @param timeout the timeout duration
   * @param <T> the type of the value
   */
  public static <T> void verifyMonoWithTimeout(Mono<T> mono, T expected, Duration timeout) {
    StepVerifier.create(mono).expectNext(expected).expectComplete().verify(timeout);
  }
}
