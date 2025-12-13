package org.example.platform.webflux.context;

import java.util.function.Function;
import org.springframework.http.HttpHeaders;
import reactor.util.context.Context;

/** Keys used for storing data in Reactor Context. */
public final class ContextKeys {
  /** Key for storing RequestMetadata in Reactor Context. */
  public static final String METADATA = "requestMetadata";

  private ContextKeys() {}

  /**
   * Creates a context modifier that adds RequestMetadata from headers.
   *
   * <p>Usage: {@code .contextWrite(ContextKeys.fromHeaders(httpHeaders))}
   *
   * @param headers HTTP headers to extract metadata from
   * @return Context modifier function
   */
  public static Function<Context, Context> fromHeaders(HttpHeaders headers) {
    RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);
    return ctx -> ctx.put(METADATA, metadata);
  }
}
