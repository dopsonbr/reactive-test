package org.example.reactivetest.logging;

import java.util.List;
import java.util.Map;

public record ResponseLogData(
    String type,
    String path,
    String uri,
    String method,
    String host,
    int status,
    List<Map<String, String>> headers,
    Object payload
) {
    public ResponseLogData(String path, String uri, String method, int status, Object payload) {
        this("response", path, uri, method, null, status, List.of(), payload);
    }

    public ResponseLogData(String path, String host, String uri, String method, int status, Object payload) {
        this("response", path, uri, method, host, status, List.of(), payload);
    }
}
