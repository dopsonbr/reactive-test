package org.example.platform.logging;

import java.util.List;
import java.util.Map;

/**
 * Log data payload for HTTP requests.
 */
public record RequestLogData(
    String type,
    String path,
    String uri,
    String method,
    String host,
    List<Map<String, String>> headers,
    Object payload
) {
    public RequestLogData(String path, String uri, String method, Object payload) {
        this("request", path, uri, method, null, List.of(), payload);
    }

    public RequestLogData(String path, String host, String uri, String method, Object payload) {
        this("request", path, uri, method, host, List.of(), payload);
    }
}
