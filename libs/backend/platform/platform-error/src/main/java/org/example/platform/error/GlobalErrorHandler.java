package org.example.platform.error;

import io.github.resilience4j.bulkhead.BulkheadFullException;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import java.util.Map;
import java.util.concurrent.TimeoutException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;

/**
 * Global error handler that maps exceptions to structured ErrorResponse. Handles Resilience4j
 * exceptions, WebClient errors, and validation errors.
 */
@RestControllerAdvice
public class GlobalErrorHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalErrorHandler.class);

  @ExceptionHandler(CallNotPermittedException.class)
  public ResponseEntity<ErrorResponse> handleCircuitBreakerOpen(
      CallNotPermittedException ex, ServerWebExchange exchange) {
    String traceId = getTraceId();
    String path = exchange.getRequest().getPath().value();

    log.warn("Circuit breaker open: {} for path {}", ex.getCausingCircuitBreakerName(), path);

    ErrorResponse response =
        ErrorResponse.of(
            "Service Unavailable",
            "Service temporarily unavailable due to circuit breaker",
            path,
            HttpStatus.SERVICE_UNAVAILABLE.value(),
            traceId,
            Map.of("circuitBreaker", ex.getCausingCircuitBreakerName()));

    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
  }

  @ExceptionHandler(TimeoutException.class)
  public ResponseEntity<ErrorResponse> handleTimeout(
      TimeoutException ex, ServerWebExchange exchange) {
    String traceId = getTraceId();
    String path = exchange.getRequest().getPath().value();

    log.warn("Request timeout for path {}: {}", path, ex.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            "Gateway Timeout",
            "Upstream service did not respond in time",
            path,
            HttpStatus.GATEWAY_TIMEOUT.value(),
            traceId);

    return ResponseEntity.status(HttpStatus.GATEWAY_TIMEOUT).body(response);
  }

  @ExceptionHandler(BulkheadFullException.class)
  public ResponseEntity<ErrorResponse> handleBulkheadFull(
      BulkheadFullException ex, ServerWebExchange exchange) {
    String traceId = getTraceId();
    String path = exchange.getRequest().getPath().value();

    log.warn("Bulkhead full for path {}: {}", path, ex.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            "Service Unavailable",
            "Too many concurrent requests",
            path,
            HttpStatus.SERVICE_UNAVAILABLE.value(),
            traceId);

    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
  }

  @ExceptionHandler(WebClientResponseException.class)
  public ResponseEntity<ErrorResponse> handleWebClientError(
      WebClientResponseException ex, ServerWebExchange exchange) {
    String traceId = getTraceId();
    String path = exchange.getRequest().getPath().value();

    log.warn("Upstream error for path {}: {} {}", path, ex.getStatusCode(), ex.getMessage());

    HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
    if (status == null) {
      status = HttpStatus.BAD_GATEWAY;
    }

    ErrorResponse response =
        ErrorResponse.of(
            status.getReasonPhrase(),
            "Upstream service error: " + ex.getMessage(),
            path,
            status.value(),
            traceId);

    return ResponseEntity.status(status).body(response);
  }

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ErrorResponse> handleNotFound(
      NotFoundException ex, ServerWebExchange exchange) {
    String traceId = getTraceId();
    String path = exchange.getRequest().getPath().value();

    log.warn("Resource not found for path {}: {}", path, ex.getMessage());

    ErrorResponse response =
        ErrorResponse.of("Not Found", ex.getMessage(), path, HttpStatus.NOT_FOUND.value(), traceId);

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
  }

  @ExceptionHandler(ValidationException.class)
  public ResponseEntity<ErrorResponse> handleValidationError(
      ValidationException ex, ServerWebExchange exchange) {
    String traceId = getTraceId();
    String path = exchange.getRequest().getPath().value();

    log.warn("Validation error for path {}: {}", path, ex.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            "Bad Request",
            "Request validation failed",
            path,
            HttpStatus.BAD_REQUEST.value(),
            traceId,
            ex.toDetailsMap());

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
  public ResponseEntity<ErrorResponse> handleAccessDenied(
      Exception ex, ServerWebExchange exchange) {
    String traceId = getTraceId();
    String path = exchange.getRequest().getPath().value();

    log.warn("Access denied for path {}: {}", path, ex.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            "Forbidden",
            "Access denied: insufficient permissions",
            path,
            HttpStatus.FORBIDDEN.value(),
            traceId);

    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ErrorResponse> handleResponseStatusException(
      ResponseStatusException ex, ServerWebExchange exchange) {
    String traceId = getTraceId();
    String path = exchange.getRequest().getPath().value();
    HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
    if (status == null) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    log.warn("ResponseStatusException for path {}: {} - {}", path, status, ex.getReason());

    ErrorResponse response =
        ErrorResponse.of(
            status.getReasonPhrase(),
            ex.getReason() != null ? ex.getReason() : status.getReasonPhrase(),
            path,
            status.value(),
            traceId);

    return ResponseEntity.status(status).body(response);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGenericError(
      Exception ex, ServerWebExchange exchange) {
    String traceId = getTraceId();
    String path = exchange.getRequest().getPath().value();

    log.error("Unhandled exception for path {}", path, ex);

    ErrorResponse response =
        ErrorResponse.of(
            "Internal Server Error",
            "An unexpected error occurred",
            path,
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            traceId);

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
  }

  /** Extract trace ID from current OpenTelemetry span. */
  protected String getTraceId() {
    SpanContext spanContext = Span.current().getSpanContext();
    return spanContext.isValid() ? spanContext.getTraceId() : null;
  }
}
