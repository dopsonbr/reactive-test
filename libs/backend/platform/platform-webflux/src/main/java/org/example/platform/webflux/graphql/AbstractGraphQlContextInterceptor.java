package org.example.platform.webflux.graphql;

import org.example.platform.webflux.context.ContextKeys;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import reactor.core.publisher.Mono;

/**
 * Base GraphQL interceptor that populates RequestMetadata into Reactor context.
 *
 * <p>Extend this class to get automatic header extraction for GraphQL endpoints.
 */
public abstract class AbstractGraphQlContextInterceptor implements WebGraphQlInterceptor {

  @Override
  public Mono<WebGraphQlResponse> intercept(WebGraphQlRequest request, Chain chain) {
    return chain.next(request).contextWrite(ContextKeys.fromHeaders(request.getHeaders()));
  }
}
