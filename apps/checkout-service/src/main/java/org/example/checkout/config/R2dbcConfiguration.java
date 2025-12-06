package org.example.checkout.config;

import io.r2dbc.postgresql.codec.Json;
import java.util.List;
import org.example.checkout.repository.JsonValue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.r2dbc.convert.R2dbcCustomConversions;
import org.springframework.data.r2dbc.dialect.PostgresDialect;

/**
 * R2DBC configuration for PostgreSQL. Registers custom converters for JSONB column types.
 *
 * <p>Uses JsonValue wrapper type to distinguish JSON columns from regular VARCHAR columns,
 * preventing the converter from being applied incorrectly.
 */
@Configuration
public class R2dbcConfiguration {

  @Bean
  public R2dbcCustomConversions r2dbcCustomConversions() {
    return R2dbcCustomConversions.of(
        PostgresDialect.INSTANCE,
        List.of(new JsonValueToJsonConverter(), new JsonToJsonValueConverter()));
  }

  /** Converter from JsonValue wrapper to PostgreSQL Json type for writing JSONB columns. */
  @WritingConverter
  static class JsonValueToJsonConverter implements Converter<JsonValue, Json> {
    @Override
    public Json convert(JsonValue source) {
      return Json.of(source.value());
    }
  }

  /** Converter from PostgreSQL Json type to JsonValue wrapper for reading JSONB columns. */
  @ReadingConverter
  static class JsonToJsonValueConverter implements Converter<Json, JsonValue> {
    @Override
    public JsonValue convert(Json source) {
      return JsonValue.of(source.asString());
    }
  }
}
