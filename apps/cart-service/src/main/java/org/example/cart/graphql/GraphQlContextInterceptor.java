package org.example.cart.graphql;

import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Intercepts GraphQL requests to populate RequestMetadata into Reactor context.
 *
 * <p>This interceptor extracts required headers (x-store-number, x-order-number, x-userid,
 * x-sessionid) from HTTP requests and makes them available to all GraphQL resolvers via Reactor
 * Context. This matches the REST controller behavior where headers are available on every request.
 *
 * <p>Note: Header validation is performed by GraphQLInputValidator to maintain separation of
 * concerns and provide aggregated error responses.
 *
 * <p>HTTP status code mapping for GraphQL errors is handled by {@link GraphQlStatusWebFilter}.
 */
@Component
public class GraphQlContextInterceptor implements WebGraphQlInterceptor {

  @Override
  public Mono<WebGraphQlResponse> intercept(WebGraphQlRequest request, Chain chain) {
    HttpHeaders headers = request.getHeaders();
    RequestMetadata metadata = extractMetadata(headers);

    return chain.next(request).contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
  }

  /**
   * Extracts RequestMetadata from HTTP headers.
   *
   * <p>If headers are missing or malformed, defaults are used (storeNumber=0, empty strings) so
   * that the validator can produce aggregated errors rather than failing immediately.
   */
  private RequestMetadata extractMetadata(HttpHeaders headers) {
    int storeNumber = parseStoreNumber(headers.getFirst("x-store-number"));
    String orderNumber = headers.getFirst("x-order-number");
    String userId = headers.getFirst("x-userid");
    String sessionId = headers.getFirst("x-sessionid");

    return new RequestMetadata(
        storeNumber,
        orderNumber != null ? orderNumber : "",
        userId != null ? userId : "",
        sessionId != null ? sessionId : "");
  }

  /**
   * Parses x-store-number header value to int.
   *
   * @return parsed store number, or 0 if missing/invalid (validation will catch this)
   */
  private int parseStoreNumber(String value) {
    if (value == null || value.isBlank()) {
      return 0;
    }
    try {
      return Integer.parseInt(value);
    } catch (NumberFormatException e) {
      return 0;
    }
  }
}
