package org.example.platform.webflux.context;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

class RequestMetadataExtractorTest {

  @Test
  void fromHeaders_extractsAllHeaders() {
    HttpHeaders headers = new HttpHeaders();
    headers.add("x-store-number", "100");
    headers.add("x-order-number", "order-123");
    headers.add("x-userid", "user01");
    headers.add("x-sessionid", "sess-456");

    RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);

    assertThat(metadata.storeNumber()).isEqualTo(100);
    assertThat(metadata.orderNumber()).isEqualTo("order-123");
    assertThat(metadata.userId()).isEqualTo("user01");
    assertThat(metadata.sessionId()).isEqualTo("sess-456");
  }

  @Test
  void fromHeaders_handlesNullHeaders() {
    RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(null);

    assertThat(metadata.storeNumber()).isEqualTo(0);
    assertThat(metadata.orderNumber()).isEmpty();
    assertThat(metadata.userId()).isEmpty();
    assertThat(metadata.sessionId()).isEmpty();
  }

  @Test
  void fromHeaders_handlesMissingHeaders() {
    HttpHeaders headers = new HttpHeaders();

    RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);

    assertThat(metadata.storeNumber()).isEqualTo(0);
    assertThat(metadata.orderNumber()).isEmpty();
    assertThat(metadata.userId()).isEmpty();
    assertThat(metadata.sessionId()).isEmpty();
  }

  @Test
  void fromHeaders_handlesInvalidStoreNumber() {
    HttpHeaders headers = new HttpHeaders();
    headers.add("x-store-number", "not-a-number");

    RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);

    assertThat(metadata.storeNumber()).isEqualTo(0);
  }

  @Test
  void fromHeaders_handlesBlankStoreNumber() {
    HttpHeaders headers = new HttpHeaders();
    headers.add("x-store-number", "  ");

    RequestMetadata metadata = RequestMetadataExtractor.fromHeaders(headers);

    assertThat(metadata.storeNumber()).isEqualTo(0);
  }
}

