package org.example.reactivetest.error;

import java.util.Map;

public record ErrorResponse(
    String error,
    String message,
    String path,
    int status,
    String traceId,
    Map<String, Object> details
) {
    public static ErrorResponse of(String error, String message, String path, int status, String traceId) {
        return new ErrorResponse(error, message, path, status, traceId, Map.of());
    }

    public static ErrorResponse of(String error, String message, String path, int status, String traceId, Map<String, Object> details) {
        return new ErrorResponse(error, message, path, status, traceId, details);
    }
}
