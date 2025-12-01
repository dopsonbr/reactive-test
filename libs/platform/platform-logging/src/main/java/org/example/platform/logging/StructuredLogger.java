package org.example.platform.logging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import reactor.util.context.ContextView;

/**
 * Structured JSON logger that extracts metadata from Reactor Context
 * and correlates logs with OpenTelemetry trace context.
 */
@Component
public class StructuredLogger {
    private static final Logger log = LoggerFactory.getLogger(StructuredLogger.class);
    private final ObjectMapper objectMapper;

    public StructuredLogger(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void logRequest(ContextView ctx, String loggerName, RequestLogData data) {
        log(ctx, loggerName, data);
    }

    public void logResponse(ContextView ctx, String loggerName, ResponseLogData data) {
        log(ctx, loggerName, data);
    }

    public void logMessage(ContextView ctx, String loggerName, String message) {
        log(ctx, loggerName, "info", new MessageLogData(message));
    }

    public void logError(ContextView ctx, String loggerName, ErrorLogData data) {
        log(ctx, loggerName, "error", data);
    }

    public void logError(ContextView ctx, String loggerName, String service, Throwable error) {
        ErrorLogData data = new ErrorLogData(
            service,
            error.getClass().getSimpleName(),
            error.getMessage()
        );
        log(ctx, loggerName, "error", data);
    }

    public void logError(ContextView ctx, String loggerName, String service, Throwable error, String circuitBreakerState) {
        ErrorLogData data = new ErrorLogData(
            service,
            error.getClass().getSimpleName(),
            error.getMessage(),
            circuitBreakerState
        );
        log(ctx, loggerName, "error", data);
    }

    private void log(ContextView ctx, String loggerName, Object data) {
        log(ctx, loggerName, "info", data);
    }

    private void log(ContextView ctx, String loggerName, String level, Object data) {
        RequestMetadata metadata = ctx.getOrDefault(ContextKeys.METADATA, null);

        // Extract trace context from current OTEL span
        String traceId = null;
        String spanId = null;
        SpanContext spanContext = Span.current().getSpanContext();
        if (spanContext.isValid()) {
            traceId = spanContext.getTraceId();
            spanId = spanContext.getSpanId();
        }

        LogEntry entry = new LogEntry(level, loggerName, traceId, spanId, metadata, data);

        try {
            String json = objectMapper.writeValueAsString(entry);
            if ("error".equals(level)) {
                log.error(json);
            } else {
                log.info(json);
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize log entry", e);
        }
    }
}
