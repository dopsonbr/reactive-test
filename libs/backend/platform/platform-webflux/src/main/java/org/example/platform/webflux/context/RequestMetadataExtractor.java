package org.example.platform.webflux.context;

import org.springframework.http.HttpHeaders;

/**
 * Extracts RequestMetadata from HTTP headers.
 *
 * <p>Centralizes null-handling and parsing logic for the 4 required headers. If headers are missing
 * or malformed, defaults are used so downstream validators can produce aggregated errors.
 */
public final class RequestMetadataExtractor {

  public static final String HEADER_STORE_NUMBER = "x-store-number";
  public static final String HEADER_ORDER_NUMBER = "x-order-number";
  public static final String HEADER_USER_ID = "x-userid";
  public static final String HEADER_SESSION_ID = "x-sessionid";

  private RequestMetadataExtractor() {}

  /**
   * Extracts RequestMetadata from HttpHeaders.
   *
   * @param headers HTTP headers (may be null)
   * @return RequestMetadata with parsed values (defaults for missing/invalid)
   */
  public static RequestMetadata fromHeaders(HttpHeaders headers) {
    if (headers == null) {
      return new RequestMetadata(0, "", "", "");
    }

    int storeNumber = parseStoreNumber(headers.getFirst(HEADER_STORE_NUMBER));
    String orderNumber = nullToEmpty(headers.getFirst(HEADER_ORDER_NUMBER));
    String userId = nullToEmpty(headers.getFirst(HEADER_USER_ID));
    String sessionId = nullToEmpty(headers.getFirst(HEADER_SESSION_ID));

    return new RequestMetadata(storeNumber, orderNumber, userId, sessionId);
  }

  private static int parseStoreNumber(String value) {
    if (value == null || value.isBlank()) {
      return 0;
    }
    try {
      return Integer.parseInt(value);
    } catch (NumberFormatException e) {
      return 0;
    }
  }

  private static String nullToEmpty(String value) {
    return value != null ? value : "";
  }
}
