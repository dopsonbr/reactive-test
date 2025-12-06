package org.example.order.repository;

/**
 * Wrapper type for JSON/JSONB column values in R2DBC. Enables the custom converter to distinguish
 * JSON columns from regular VARCHAR columns.
 */
public record JsonValue(String value) {

  public static JsonValue of(String value) {
    return value == null ? null : new JsonValue(value);
  }

  public static String unwrap(JsonValue jsonValue) {
    return jsonValue == null ? null : jsonValue.value();
  }
}
