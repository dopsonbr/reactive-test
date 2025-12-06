package org.example.order.config;

import io.r2dbc.postgresql.codec.Json;
import java.util.List;
import org.example.order.repository.JsonValue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.r2dbc.convert.R2dbcCustomConversions;
import org.springframework.data.r2dbc.dialect.PostgresDialect;

/** Configures custom R2DBC converters for JSONB column handling. */
@Configuration
public class R2dbcConfiguration {

  @Bean
  public R2dbcCustomConversions r2dbcCustomConversions() {
    return R2dbcCustomConversions.of(
        PostgresDialect.INSTANCE,
        List.of(new JsonValueToJsonConverter(), new JsonToJsonValueConverter()));
  }

  @WritingConverter
  static class JsonValueToJsonConverter implements Converter<JsonValue, Json> {
    @Override
    public Json convert(JsonValue source) {
      return Json.of(source.value());
    }
  }

  @ReadingConverter
  static class JsonToJsonValueConverter implements Converter<Json, JsonValue> {
    @Override
    public JsonValue convert(Json source) {
      return JsonValue.of(source.asString());
    }
  }
}
