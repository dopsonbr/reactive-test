package org.example.platform.webflux.context;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.function.Function;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import reactor.util.context.Context;

class ContextKeysTest {

  @Test
  void fromHeaders_createsContextModifier() {
    HttpHeaders headers = new HttpHeaders();
    headers.add("x-store-number", "100");
    headers.add("x-userid", "user01");

    Function<Context, Context> modifier = ContextKeys.fromHeaders(headers);
    Context ctx = modifier.apply(Context.empty());

    assertThat(ctx.hasKey(ContextKeys.METADATA)).isTrue();
    RequestMetadata metadata = ctx.get(ContextKeys.METADATA);
    assertThat(metadata.storeNumber()).isEqualTo(100);
    assertThat(metadata.userId()).isEqualTo("user01");
  }

  @Test
  void fromHeaders_worksWithEmptyHeaders() {
    HttpHeaders headers = new HttpHeaders();

    Function<Context, Context> modifier = ContextKeys.fromHeaders(headers);
    Context ctx = modifier.apply(Context.empty());

    assertThat(ctx.hasKey(ContextKeys.METADATA)).isTrue();
    RequestMetadata metadata = ctx.get(ContextKeys.METADATA);
    assertThat(metadata.storeNumber()).isEqualTo(0);
  }

  @Test
  void fromHeaders_worksWithNullHeaders() {
    Function<Context, Context> modifier = ContextKeys.fromHeaders(null);
    Context ctx = modifier.apply(Context.empty());

    assertThat(ctx.hasKey(ContextKeys.METADATA)).isTrue();
    RequestMetadata metadata = ctx.get(ContextKeys.METADATA);
    assertThat(metadata.storeNumber()).isEqualTo(0);
    assertThat(metadata.orderNumber()).isEmpty();
  }

  @Test
  void fromHeaders_preservesExistingContextKeys() {
    HttpHeaders headers = new HttpHeaders();
    headers.add("x-store-number", "200");
    headers.add("x-order-number", "order-xyz");
    headers.add("x-userid", "testuser");
    headers.add("x-sessionid", "session-abc");

    // Simulate how this would be used in a reactive chain
    Context baseContext = Context.of("existingKey", "existingValue");
    Function<Context, Context> modifier = ContextKeys.fromHeaders(headers);
    Context enrichedContext = modifier.apply(baseContext);

    // Verify existing keys are preserved
    assertThat((String) enrichedContext.get("existingKey")).isEqualTo("existingValue");

    // Verify metadata was added
    RequestMetadata metadata = enrichedContext.get(ContextKeys.METADATA);
    assertThat(metadata.storeNumber()).isEqualTo(200);
    assertThat(metadata.orderNumber()).isEqualTo("order-xyz");
    assertThat(metadata.userId()).isEqualTo("testuser");
    assertThat(metadata.sessionId()).isEqualTo("session-abc");
  }
}

