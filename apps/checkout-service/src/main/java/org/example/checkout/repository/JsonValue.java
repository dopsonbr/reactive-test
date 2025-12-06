package org.example.checkout.repository;

/**
 * Wrapper type for JSON string values to distinguish them from regular String columns. This allows
 * R2DBC converters to specifically target JSON columns without affecting VARCHAR columns.
 */
public record JsonValue(String value) {
  public static JsonValue of(String value) {
    return value == null ? null : new JsonValue(value);
  }

  public static String unwrap(JsonValue jsonValue) {
    return jsonValue == null ? null : jsonValue.value();
  }
}
