package org.example.audit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import org.example.audit.domain.TimeRange;
import org.example.audit.repository.AuditRepository;
import org.example.platform.audit.AuditEvent;
import org.example.platform.audit.AuditEventType;
import org.example.platform.audit.EntityType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock private AuditRepository auditRepository;

    private AuditService auditService;

    @BeforeEach
    void setUp() {
        auditService = new AuditService(auditRepository);
    }

    @Test
    void save_delegatesToRepository() {
        AuditEvent event = createTestEvent();
        when(auditRepository.save(event)).thenReturn(Mono.just(event));

        StepVerifier.create(auditService.save(event)).expectNext(event).verifyComplete();

        verify(auditRepository).save(event);
    }

    @Test
    void findById_delegatesToRepository() {
        AuditEvent event = createTestEvent();
        when(auditRepository.findById("event-123")).thenReturn(Mono.just(event));

        StepVerifier.create(auditService.findById("event-123")).expectNext(event).verifyComplete();

        verify(auditRepository).findById("event-123");
    }

    @Test
    void findById_returnsEmptyWhenNotFound() {
        when(auditRepository.findById("not-found")).thenReturn(Mono.empty());

        StepVerifier.create(auditService.findById("not-found")).verifyComplete();
    }

    @Test
    void findByEntity_normalizesLimitToDefault() {
        AuditEvent event = createTestEvent();
        when(auditRepository.findByEntity(anyString(), anyString(), any(), any(), anyInt()))
                .thenReturn(Flux.just(event));

        StepVerifier.create(
                        auditService.findByEntity(
                                EntityType.CART, "cart-123", TimeRange.unbounded(), null, 0))
                .expectNext(event)
                .verifyComplete();

        ArgumentCaptor<Integer> limitCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(auditRepository)
                .findByEntity(
                        eq(EntityType.CART),
                        eq("cart-123"),
                        any(TimeRange.class),
                        isNull(),
                        limitCaptor.capture());

        assertThat(limitCaptor.getValue()).isEqualTo(100); // Default limit
    }

    @Test
    void findByEntity_normalizesLimitToMax() {
        AuditEvent event = createTestEvent();
        when(auditRepository.findByEntity(anyString(), anyString(), any(), any(), anyInt()))
                .thenReturn(Flux.just(event));

        StepVerifier.create(
                        auditService.findByEntity(
                                EntityType.CART, "cart-123", TimeRange.unbounded(), null, 5000))
                .expectNext(event)
                .verifyComplete();

        ArgumentCaptor<Integer> limitCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(auditRepository)
                .findByEntity(
                        eq(EntityType.CART),
                        eq("cart-123"),
                        any(TimeRange.class),
                        isNull(),
                        limitCaptor.capture());

        assertThat(limitCaptor.getValue()).isEqualTo(1000); // Max limit
    }

    @Test
    void findByEntity_preservesValidLimit() {
        AuditEvent event = createTestEvent();
        when(auditRepository.findByEntity(anyString(), anyString(), any(), any(), anyInt()))
                .thenReturn(Flux.just(event));

        StepVerifier.create(
                        auditService.findByEntity(
                                EntityType.CART, "cart-123", TimeRange.unbounded(), null, 50))
                .expectNext(event)
                .verifyComplete();

        ArgumentCaptor<Integer> limitCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(auditRepository)
                .findByEntity(
                        eq(EntityType.CART),
                        eq("cart-123"),
                        any(TimeRange.class),
                        isNull(),
                        limitCaptor.capture());

        assertThat(limitCaptor.getValue()).isEqualTo(50);
    }

    @Test
    void findByEntity_normalizesNullTimeRange() {
        AuditEvent event = createTestEvent();
        when(auditRepository.findByEntity(anyString(), anyString(), any(), any(), anyInt()))
                .thenReturn(Flux.just(event));

        StepVerifier.create(auditService.findByEntity(EntityType.CART, "cart-123", null, null, 100))
                .expectNext(event)
                .verifyComplete();

        ArgumentCaptor<TimeRange> timeRangeCaptor = ArgumentCaptor.forClass(TimeRange.class);
        verify(auditRepository)
                .findByEntity(
                        eq(EntityType.CART),
                        eq("cart-123"),
                        timeRangeCaptor.capture(),
                        isNull(),
                        eq(100));

        assertThat(timeRangeCaptor.getValue().hasStart()).isFalse();
        assertThat(timeRangeCaptor.getValue().hasEnd()).isFalse();
    }

    @Test
    void findByUser_delegatesToRepository() {
        AuditEvent event = createTestEvent();
        TimeRange timeRange = TimeRange.since(Instant.parse("2024-01-01T00:00:00Z"));
        when(auditRepository.findByUser(anyString(), any(), anyInt())).thenReturn(Flux.just(event));

        StepVerifier.create(auditService.findByUser("user01", timeRange, 50))
                .expectNext(event)
                .verifyComplete();

        verify(auditRepository).findByUser(eq("user01"), eq(timeRange), eq(50));
    }

    @Test
    void findByStoreAndEntityType_delegatesToRepository() {
        AuditEvent event = createTestEvent();
        TimeRange timeRange = TimeRange.unbounded();
        when(auditRepository.findByStoreAndEntityType(
                        anyInt(), anyString(), any(), any(), anyInt()))
                .thenReturn(Flux.just(event));

        StepVerifier.create(
                        auditService.findByStoreAndEntityType(
                                100, EntityType.CART, timeRange, AuditEventType.CART_CREATED, 100))
                .expectNext(event)
                .verifyComplete();

        verify(auditRepository)
                .findByStoreAndEntityType(
                        eq(100),
                        eq(EntityType.CART),
                        eq(timeRange),
                        eq(AuditEventType.CART_CREATED),
                        eq(100));
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
                Instant.now(),
                Map.of("items", 3));
    }
}
