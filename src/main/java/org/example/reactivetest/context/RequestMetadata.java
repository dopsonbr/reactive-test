package org.example.reactivetest.context;

public record RequestMetadata(
    int storeNumber,
    String orderNumber,
    String userId,
    String sessionId
) {}
