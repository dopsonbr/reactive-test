package org.example.platform.events;

import io.cloudevents.CloudEvent;
import reactor.core.publisher.Mono;

/** Publisher interface for CloudEvents. */
public interface CloudEventPublisher {

  /**
   * Publish a CloudEvent (fire-and-forget).
   *
   * <p>Errors are logged but not propagated.
   *
   * @param event the CloudEvent to publish
   * @return Mono completing when publish attempt is done
   */
  Mono<Void> publish(CloudEvent event);

  /**
   * Publish a CloudEvent and await confirmation.
   *
   * @param event the CloudEvent to publish
   * @return Mono with the record ID on success, error on failure
   */
  Mono<String> publishAndAwait(CloudEvent event);
}
