package org.example.reactivetest.logging;

import org.example.reactivetest.context.RequestMetadata;

public record LogEntry(
    String level,
    String logger,
    RequestMetadata metadata,
    Object data
) {}
