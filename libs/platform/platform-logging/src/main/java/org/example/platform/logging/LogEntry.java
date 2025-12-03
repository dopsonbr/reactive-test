package org.example.platform.logging;

import org.example.platform.webflux.context.RequestMetadata;

/** Root envelope for structured log entries. */
public record LogEntry(
        String level,
        String logger,
        String traceId,
        String spanId,
        RequestMetadata metadata,
        Object data) {}
