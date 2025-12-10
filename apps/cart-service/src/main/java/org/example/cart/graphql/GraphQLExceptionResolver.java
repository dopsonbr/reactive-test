package org.example.cart.graphql;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import io.github.resilience4j.bulkhead.BulkheadFullException;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import java.net.ConnectException;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;
import org.example.platform.error.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;

/** Converts service exceptions to GraphQL errors with appropriate types. */
@Component
public class GraphQLExceptionResolver extends DataFetcherExceptionResolverAdapter {

  private static final Logger log = LoggerFactory.getLogger(GraphQLExceptionResolver.class);

  @Override
  protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
    log.error("GraphQL exception in {}: {}", env.getField().getName(), ex.getMessage(), ex);
    if (ex instanceof ValidationException ve) {
      Map<String, Object> extensions =
          Map.of(
              "validationErrors",
              ve.getErrors().stream()
                  .collect(
                      Collectors.toMap(e -> e.field(), e -> e.message(), (a, b) -> a + "; " + b)));
      return GraphqlErrorBuilder.newError(env)
          .message("Validation failed")
          .errorType(ErrorType.BAD_REQUEST)
          .extensions(extensions)
          .build();
    }

    if (ex instanceof ResponseStatusException rse) {
      int status = rse.getStatusCode().value();
      if (status == 404) {
        return GraphqlErrorBuilder.newError(env)
            .message(rse.getReason() != null ? rse.getReason() : "Not found")
            .errorType(ErrorType.NOT_FOUND)
            .build();
      }
      if (status == 400) {
        return GraphqlErrorBuilder.newError(env)
            .message(rse.getReason() != null ? rse.getReason() : "Bad request")
            .errorType(ErrorType.BAD_REQUEST)
            .build();
      }
    }

    if (ex instanceof NoSuchElementException) {
      return GraphqlErrorBuilder.newError(env)
          .message(ex.getMessage())
          .errorType(ErrorType.NOT_FOUND)
          .build();
    }

    if (ex instanceof IllegalArgumentException) {
      return GraphqlErrorBuilder.newError(env)
          .message(ex.getMessage())
          .errorType(ErrorType.BAD_REQUEST)
          .build();
    }

    if (ex instanceof AccessDeniedException) {
      return GraphqlErrorBuilder.newError(env)
          .message("Access denied")
          .errorType(ErrorType.FORBIDDEN)
          .build();
    }

    // Handle WebClient errors from external service calls (product-service, etc.)
    if (ex instanceof WebClientResponseException wce) {
      int status = wce.getStatusCode().value();
      if (status == 404) {
        return GraphqlErrorBuilder.newError(env)
            .message("Resource not found: " + wce.getStatusText())
            .errorType(ErrorType.NOT_FOUND)
            .extensions(Map.of("code", "RESOURCE_NOT_FOUND", "httpStatus", status))
            .build();
      }
      if (status == 400) {
        return GraphqlErrorBuilder.newError(env)
            .message("Bad request: " + wce.getStatusText())
            .errorType(ErrorType.BAD_REQUEST)
            .extensions(Map.of("code", "BAD_REQUEST", "httpStatus", status))
            .build();
      }
      if (status == 503 || status == 502 || status == 504) {
        return GraphqlErrorBuilder.newError(env)
            .message("Service temporarily unavailable")
            .errorType(ErrorType.INTERNAL_ERROR)
            .extensions(Map.of("code", "SERVICE_UNAVAILABLE", "httpStatus", status))
            .build();
      }
      // Other HTTP errors
      return GraphqlErrorBuilder.newError(env)
          .message("External service error")
          .errorType(ErrorType.INTERNAL_ERROR)
          .extensions(Map.of("code", "EXTERNAL_SERVICE_ERROR", "httpStatus", status))
          .build();
    }

    // Handle connection errors (service unavailable)
    if (ex instanceof WebClientRequestException wre) {
      Throwable cause = wre.getCause();
      if (cause instanceof ConnectException) {
        return GraphqlErrorBuilder.newError(env)
            .message("Service unavailable: unable to connect")
            .errorType(ErrorType.INTERNAL_ERROR)
            .extensions(Map.of("code", "SERVICE_UNAVAILABLE"))
            .build();
      }
      return GraphqlErrorBuilder.newError(env)
          .message("Service unavailable")
          .errorType(ErrorType.INTERNAL_ERROR)
          .extensions(Map.of("code", "SERVICE_UNAVAILABLE"))
          .build();
    }

    // Handle Resilience4j circuit breaker open
    if (ex instanceof CallNotPermittedException) {
      return GraphqlErrorBuilder.newError(env)
          .message("Service temporarily unavailable (circuit breaker open)")
          .errorType(ErrorType.INTERNAL_ERROR)
          .extensions(Map.of("code", "CIRCUIT_BREAKER_OPEN"))
          .build();
    }

    // Handle Resilience4j bulkhead full
    if (ex instanceof BulkheadFullException) {
      return GraphqlErrorBuilder.newError(env)
          .message("Service temporarily unavailable (too many concurrent requests)")
          .errorType(ErrorType.INTERNAL_ERROR)
          .extensions(Map.of("code", "BULKHEAD_FULL"))
          .build();
    }

    // Handle timeout exceptions
    if (ex instanceof TimeoutException) {
      return GraphqlErrorBuilder.newError(env)
          .message("Request timed out")
          .errorType(ErrorType.INTERNAL_ERROR)
          .extensions(Map.of("code", "TIMEOUT"))
          .build();
    }

    // Default: internal error (don't expose details)
    return GraphqlErrorBuilder.newError(env)
        .message("Internal server error")
        .errorType(ErrorType.INTERNAL_ERROR)
        .build();
  }
}
