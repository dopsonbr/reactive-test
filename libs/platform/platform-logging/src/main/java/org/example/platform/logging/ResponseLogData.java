package org.example.platform.logging;

import java.util.List;
import java.util.Map;

/** Log data payload for HTTP responses. */
public record ResponseLogData(
        String type,
        String path,
        String uri,
        String method,
        String host,
        int status,
        List<Map<String, String>> headers,
        Object payload) {
    public ResponseLogData(String path, String uri, String method, int status, Object payload) {
        this("response", path, uri, method, null, status, List.of(), payload);
    }

    public ResponseLogData(
            String path, String host, String uri, String method, int status, Object payload) {
        this("response", path, uri, method, host, status, List.of(), payload);
    }
}
