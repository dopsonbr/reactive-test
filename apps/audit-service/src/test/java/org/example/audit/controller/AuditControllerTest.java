package org.example.audit.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.Instant;
import org.example.audit.domain.AuditRecord;
import org.example.audit.service.AuditService;
import org.example.audit.validation.AuditRequestValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webflux.test.autoconfigure.WebFluxTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@WebFluxTest(AuditController.class)
@Import(TestSecurityConfig.class)
class AuditControllerTest {

  @Autowired private WebTestClient webTestClient;

  @MockitoBean private AuditService auditService;

  @MockitoBean private AuditRequestValidator auditRequestValidator;

  @BeforeEach
  void setupMocks() {
    // Configure validator to pass all validation by default
    when(auditRequestValidator.validateAuditRecord(any())).thenReturn(Mono.empty());
    when(auditRequestValidator.validateEventId(anyString())).thenReturn(Mono.empty());
    when(auditRequestValidator.validateEntityQuery(anyString(), anyString(), anyInt()))
        .thenReturn(Mono.empty());
    when(auditRequestValidator.validateUserQuery(anyString(), anyInt())).thenReturn(Mono.empty());
    when(auditRequestValidator.validateStoreQuery(anyInt(), anyString(), anyInt()))
        .thenReturn(Mono.empty());
  }

  @Test
  void createEvent_returns201() {
    AuditRecord record = createTestRecord();
    when(auditService.save(any(AuditRecord.class))).thenReturn(Mono.just(record));

    webTestClient
        .post()
        .uri("/audit/events")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(record)
        .exchange()
        .expectStatus()
        .isCreated()
        .expectBody()
        .jsonPath("$.eventId")
        .isEqualTo(record.getEventId())
        .jsonPath("$.eventType")
        .isEqualTo("CART_CREATED")
        .jsonPath("$.entityType")
        .isEqualTo("CART")
        .jsonPath("$.entityId")
        .isEqualTo("cart-456");
  }

  @Test
  void createEvent_generatesEventIdWhenNotProvided() {
    AuditRecord recordWithoutId = new AuditRecord();
    recordWithoutId.setEventType("CART_CREATED");
    recordWithoutId.setEntityType("CART");
    recordWithoutId.setEntityId("cart-456");
    recordWithoutId.setStoreNumber(100);

    // Mock save to return record with generated ID
    when(auditService.save(any(AuditRecord.class)))
        .thenAnswer(
            invocation -> {
              AuditRecord saved = invocation.getArgument(0);
              return Mono.just(saved);
            });

    webTestClient
        .post()
        .uri("/audit/events")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(recordWithoutId)
        .exchange()
        .expectStatus()
        .isCreated()
        .expectBody()
        .jsonPath("$.eventId")
        .isNotEmpty()
        .jsonPath("$.createdAt")
        .isNotEmpty();
  }

  @Test
  void getEvent_returnsEvent() {
    AuditRecord record = createTestRecord();
    when(auditService.findByEventId("event-123")).thenReturn(Mono.just(record));

    webTestClient
        .get()
        .uri("/audit/events/event-123")
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.eventId")
        .isEqualTo("event-123")
        .jsonPath("$.eventType")
        .isEqualTo("CART_CREATED");
  }

  @Test
  void getEvent_returns404WhenNotFound() {
    when(auditService.findByEventId("not-found")).thenReturn(Mono.empty());

    webTestClient.get().uri("/audit/events/not-found").exchange().expectStatus().isNotFound();
  }

  @Test
  void getEventsForEntity_returnsEvents() {
    AuditRecord record = createTestRecord();
    when(auditService.findByEntity(anyString(), anyString(), any(), any(), anyInt()))
        .thenReturn(Flux.just(record));

    webTestClient
        .get()
        .uri("/audit/entities/CART/cart-456/events")
        .exchange()
        .expectStatus()
        .isOk()
        .expectBodyList(AuditRecord.class)
        .hasSize(1);
  }

  @Test
  void getEventsForEntity_withQueryParams_passesParameters() {
    AuditRecord record = createTestRecord();
    when(auditService.findByEntity(eq("CART"), eq("cart-456"), any(), eq("PRODUCT_ADDED"), eq(50)))
        .thenReturn(Flux.just(record));

    webTestClient
        .get()
        .uri(
            uriBuilder ->
                uriBuilder
                    .path("/audit/entities/CART/cart-456/events")
                    .queryParam("eventType", "PRODUCT_ADDED")
                    .queryParam("limit", 50)
                    .build())
        .exchange()
        .expectStatus()
        .isOk();
  }

  @Test
  void getEventsForUser_returnsEvents() {
    AuditRecord record = createTestRecord();
    when(auditService.findByUser(eq("user01"), any(), anyInt())).thenReturn(Flux.just(record));

    webTestClient
        .get()
        .uri("/audit/users/user01/events")
        .exchange()
        .expectStatus()
        .isOk()
        .expectBodyList(AuditRecord.class)
        .hasSize(1);
  }

  @Test
  void getEventsForUser_withTimeRange_passesParameters() {
    AuditRecord record = createTestRecord();
    String startTime = "2024-01-01T00:00:00Z";
    String endTime = "2024-12-31T23:59:59Z";

    when(auditService.findByUser(eq("user01"), any(), eq(200))).thenReturn(Flux.just(record));

    webTestClient
        .get()
        .uri(
            uriBuilder ->
                uriBuilder
                    .path("/audit/users/user01/events")
                    .queryParam("startTime", startTime)
                    .queryParam("endTime", endTime)
                    .queryParam("limit", 200)
                    .build())
        .exchange()
        .expectStatus()
        .isOk();
  }

  @Test
  void getEventsForStore_returnsEvents() {
    AuditRecord record = createTestRecord();
    when(auditService.findByStoreAndEntityType(eq(100), eq("CART"), any(), any(), anyInt()))
        .thenReturn(Flux.just(record));

    webTestClient
        .get()
        .uri(
            uriBuilder ->
                uriBuilder
                    .path("/audit/stores/100/events")
                    .queryParam("entityType", "CART")
                    .build())
        .exchange()
        .expectStatus()
        .isOk()
        .expectBodyList(AuditRecord.class)
        .hasSize(1);
  }

  @Test
  void getEventsForStore_withAllParams_passesParameters() {
    AuditRecord record = createTestRecord();
    when(auditService.findByStoreAndEntityType(
            eq(200), eq("CART"), any(), eq("CART_CREATED"), eq(75)))
        .thenReturn(Flux.just(record));

    webTestClient
        .get()
        .uri(
            uriBuilder ->
                uriBuilder
                    .path("/audit/stores/200/events")
                    .queryParam("entityType", "CART")
                    .queryParam("eventType", "CART_CREATED")
                    .queryParam("limit", 75)
                    .build())
        .exchange()
        .expectStatus()
        .isOk();
  }

  @Test
  void getEventsForStore_returnsEmptyList() {
    when(auditService.findByStoreAndEntityType(anyInt(), anyString(), any(), any(), anyInt()))
        .thenReturn(Flux.empty());

    webTestClient
        .get()
        .uri(
            uriBuilder ->
                uriBuilder
                    .path("/audit/stores/999/events")
                    .queryParam("entityType", "CART")
                    .build())
        .exchange()
        .expectStatus()
        .isOk()
        .expectBodyList(AuditRecord.class)
        .hasSize(0);
  }

  private AuditRecord createTestRecord() {
    AuditRecord record = new AuditRecord();
    record.setEventId("event-123");
    record.setEventType("CART_CREATED");
    record.setEntityType("CART");
    record.setEntityId("cart-456");
    record.setStoreNumber(100);
    record.setUserId("user01");
    record.setSessionId("session-uuid");
    record.setTraceId("trace-uuid");
    record.setCreatedAt(Instant.parse("2024-06-15T10:30:00Z"));
    record.setData("{\"items\": 3}");
    return record;
  }
}
