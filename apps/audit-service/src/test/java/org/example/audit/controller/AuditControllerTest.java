package org.example.audit.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import org.example.audit.service.AuditService;
import org.example.platform.audit.AuditEvent;
import org.example.platform.audit.AuditEventType;
import org.example.platform.audit.EntityType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@WebFluxTest(AuditController.class)
@Import(TestSecurityConfig.class)
class AuditControllerTest {

    @Autowired private WebTestClient webTestClient;

    @MockBean private AuditService auditService;

    @Test
    void createEvent_returns201() {
        AuditEvent event = createTestEvent();
        when(auditService.save(any(AuditEvent.class))).thenReturn(Mono.just(event));

        webTestClient
                .post()
                .uri("/audit/events")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(event)
                .exchange()
                .expectStatus()
                .isCreated()
                .expectBody()
                .jsonPath("$.eventId")
                .isEqualTo(event.eventId())
                .jsonPath("$.eventType")
                .isEqualTo(AuditEventType.CART_CREATED)
                .jsonPath("$.entityType")
                .isEqualTo(EntityType.CART)
                .jsonPath("$.entityId")
                .isEqualTo("cart-456");
    }

    @Test
    void getEvent_returnsEvent() {
        AuditEvent event = createTestEvent();
        when(auditService.findById("event-123")).thenReturn(Mono.just(event));

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
                .isEqualTo(AuditEventType.CART_CREATED);
    }

    @Test
    void getEvent_returns404WhenNotFound() {
        when(auditService.findById("not-found")).thenReturn(Mono.empty());

        webTestClient.get().uri("/audit/events/not-found").exchange().expectStatus().isNotFound();
    }

    @Test
    void getEventsForEntity_returnsEvents() {
        AuditEvent event = createTestEvent();
        when(auditService.findByEntity(anyString(), anyString(), any(), any(), anyInt()))
                .thenReturn(Flux.just(event));

        webTestClient
                .get()
                .uri("/audit/entities/CART/cart-456/events")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBodyList(AuditEvent.class)
                .hasSize(1);
    }

    @Test
    void getEventsForEntity_withQueryParams_passesParameters() {
        AuditEvent event = createTestEvent();
        when(auditService.findByEntity(
                        eq(EntityType.CART),
                        eq("cart-456"),
                        any(),
                        eq(AuditEventType.PRODUCT_ADDED),
                        eq(50)))
                .thenReturn(Flux.just(event));

        webTestClient
                .get()
                .uri(
                        uriBuilder ->
                                uriBuilder
                                        .path("/audit/entities/CART/cart-456/events")
                                        .queryParam("eventType", AuditEventType.PRODUCT_ADDED)
                                        .queryParam("limit", 50)
                                        .build())
                .exchange()
                .expectStatus()
                .isOk();
    }

    @Test
    void getEventsForUser_returnsEvents() {
        AuditEvent event = createTestEvent();
        when(auditService.findByUser(eq("user01"), any(), anyInt())).thenReturn(Flux.just(event));

        webTestClient
                .get()
                .uri("/audit/users/user01/events")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBodyList(AuditEvent.class)
                .hasSize(1);
    }

    @Test
    void getEventsForUser_withTimeRange_passesParameters() {
        AuditEvent event = createTestEvent();
        String startTime = "2024-01-01T00:00:00Z";
        String endTime = "2024-12-31T23:59:59Z";

        when(auditService.findByUser(eq("user01"), any(), eq(200))).thenReturn(Flux.just(event));

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
        AuditEvent event = createTestEvent();
        when(auditService.findByStoreAndEntityType(
                        eq(100), eq(EntityType.CART), any(), any(), anyInt()))
                .thenReturn(Flux.just(event));

        webTestClient
                .get()
                .uri(
                        uriBuilder ->
                                uriBuilder
                                        .path("/audit/stores/100/events")
                                        .queryParam("entityType", EntityType.CART)
                                        .build())
                .exchange()
                .expectStatus()
                .isOk()
                .expectBodyList(AuditEvent.class)
                .hasSize(1);
    }

    @Test
    void getEventsForStore_withAllParams_passesParameters() {
        AuditEvent event = createTestEvent();
        when(auditService.findByStoreAndEntityType(
                        eq(200),
                        eq(EntityType.CART),
                        any(),
                        eq(AuditEventType.CART_CREATED),
                        eq(75)))
                .thenReturn(Flux.just(event));

        webTestClient
                .get()
                .uri(
                        uriBuilder ->
                                uriBuilder
                                        .path("/audit/stores/200/events")
                                        .queryParam("entityType", EntityType.CART)
                                        .queryParam("eventType", AuditEventType.CART_CREATED)
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
                                        .queryParam("entityType", EntityType.CART)
                                        .build())
                .exchange()
                .expectStatus()
                .isOk()
                .expectBodyList(AuditEvent.class)
                .hasSize(0);
    }

    private AuditEvent createTestEvent() {
        return new AuditEvent(
                "event-123",
                AuditEventType.CART_CREATED,
                EntityType.CART,
                "cart-456",
                100,
                "user01",
                "session-uuid",
                "trace-uuid",
                Instant.parse("2024-06-15T10:30:00Z"),
                Map.of("items", 3));
    }
}
