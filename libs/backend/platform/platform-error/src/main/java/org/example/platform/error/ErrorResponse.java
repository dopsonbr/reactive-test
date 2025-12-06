package org.example.platform.error;

import java.util.Map;

/** Structured error response for API errors. Includes trace correlation for observability. */
public record ErrorResponse(
    String error,
    String message,
    String path,
    int status,
    String traceId,
    Map<String, Object> details) {
  /** Create an ErrorResponse without additional details. */
  public static ErrorResponse of(
      String error, String message, String path, int status, String traceId) {
    return new ErrorResponse(error, message, path, status, traceId, Map.of());
  }

  /** Create an ErrorResponse with additional details. */
  public static ErrorResponse of(
      String error,
      String message,
      String path,
      int status,
      String traceId,
      Map<String, Object> details) {
    return new ErrorResponse(error, message, path, status, traceId, details);
  }
}
