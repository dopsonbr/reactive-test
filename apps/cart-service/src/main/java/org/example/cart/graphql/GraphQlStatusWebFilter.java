package org.example.cart.graphql;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import org.reactivestreams.Publisher;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * WebFilter that sets HTTP status code based on GraphQL error classification.
 *
 * <p>By default, GraphQL returns HTTP 200 for all responses per spec. This filter inspects the
 * GraphQL response body for errors and sets the HTTP status code accordingly.
 *
 * <p>This deviates from GraphQL spec but provides clearer error signaling:
 *
 * <ul>
 *   <li>500 for INTERNAL_ERROR - server/infrastructure failures
 *   <li>404 for NOT_FOUND - resource doesn't exist
 *   <li>400 for BAD_REQUEST - validation failures
 *   <li>403 for FORBIDDEN - authorization failures
 *   <li>401 for UNAUTHORIZED - authentication required
 * </ul>
 *
 * <p>This filter is disabled in tests to maintain GraphQL spec compliance (always HTTP 200). Set
 * {@code graphql.status-filter.enabled=false} to disable.
 */
@Component
@ConditionalOnProperty(
    name = "graphql.status-filter.enabled",
    havingValue = "true",
    matchIfMissing = true)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GraphQlStatusWebFilter implements WebFilter {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
    // Only apply to GraphQL endpoint
    String path = exchange.getRequest().getPath().value();
    if (!path.equals("/graphql")) {
      return chain.filter(exchange);
    }

    DataBufferFactory bufferFactory = exchange.getResponse().bufferFactory();

    ServerHttpResponseDecorator decoratedResponse =
        new ServerHttpResponseDecorator(exchange.getResponse()) {
          @Override
          public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
            return DataBufferUtils.join(Flux.from(body))
                .flatMap(
                    dataBuffer -> {
                      byte[] content = new byte[dataBuffer.readableByteCount()];
                      dataBuffer.read(content);
                      DataBufferUtils.release(dataBuffer);

                      // Parse response to check for errors
                      HttpStatus status = determineStatusFromResponse(content);
                      if (status != HttpStatus.OK) {
                        setStatusCode(status);
                      }

                      // Write the original content back
                      return super.writeWith(Mono.just(bufferFactory.wrap(content)));
                    });
          }
        };

    return chain.filter(exchange.mutate().response(decoratedResponse).build());
  }

  /**
   * Parses the GraphQL response JSON and determines the appropriate HTTP status.
   *
   * @param content the response body bytes
   * @return the HTTP status to set
   */
  private HttpStatus determineStatusFromResponse(byte[] content) {
    try {
      String json = new String(content, StandardCharsets.UTF_8);
      JsonNode root = objectMapper.readTree(json);
      JsonNode errors = root.get("errors");

      if (errors == null || !errors.isArray() || errors.isEmpty()) {
        return HttpStatus.OK;
      }

      // Find the most severe error classification
      HttpStatus status = HttpStatus.OK;
      for (JsonNode error : errors) {
        JsonNode extensions = error.get("extensions");
        if (extensions != null) {
          JsonNode classification = extensions.get("classification");
          if (classification != null) {
            HttpStatus errorStatus = mapClassificationToStatus(classification.asText());
            if (errorStatus.value() > status.value()) {
              status = errorStatus;
            }
          }
        }
      }

      return status;
    } catch (Exception e) {
      // If we can't parse, keep 200
      return HttpStatus.OK;
    }
  }

  /**
   * Maps GraphQL error classification to HTTP status.
   *
   * @param classification the error classification string
   * @return the corresponding HTTP status
   */
  private HttpStatus mapClassificationToStatus(String classification) {
    if (classification == null) {
      return HttpStatus.OK;
    }
    return switch (classification) {
      case "INTERNAL_ERROR" -> HttpStatus.INTERNAL_SERVER_ERROR;
      case "NOT_FOUND" -> HttpStatus.NOT_FOUND;
      case "BAD_REQUEST" -> HttpStatus.BAD_REQUEST;
      case "FORBIDDEN" -> HttpStatus.FORBIDDEN;
      case "UNAUTHORIZED" -> HttpStatus.UNAUTHORIZED;
      default -> HttpStatus.OK;
    };
  }
}
