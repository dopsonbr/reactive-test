package org.example.cart.graphql;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;
import org.example.platform.error.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
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

    // Default: internal error (don't expose details)
    return GraphqlErrorBuilder.newError(env)
        .message("Internal server error")
        .errorType(ErrorType.INTERNAL_ERROR)
        .build();
  }
}
