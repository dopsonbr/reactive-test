package org.example.reactivetest.logging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.reactivetest.context.ContextKeys;
import org.example.reactivetest.context.RequestMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import reactor.util.context.ContextView;

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
        log(ctx, loggerName, new MessageLogData(message));
    }

    private void log(ContextView ctx, String loggerName, Object data) {
        RequestMetadata metadata = ctx.getOrDefault(ContextKeys.METADATA, null);
        LogEntry entry = new LogEntry("info", loggerName, metadata, data);

        try {
            String json = objectMapper.writeValueAsString(entry);
            log.info(json);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize log entry", e);
        }
    }
}
