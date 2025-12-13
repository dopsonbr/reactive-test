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
import org.example.audit.domain.AuditRecord;
import org.example.audit.domain.TimeRange;
import org.example.audit.repository.AuditRepository;
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
    AuditRecord record = createTestRecord();
    when(auditRepository.saveRecord(record)).thenReturn(Mono.just(record));

    StepVerifier.create(auditService.save(record)).expectNext(record).verifyComplete();

    verify(auditRepository).saveRecord(record);
  }

  @Test
  void findByEventId_delegatesToRepository() {
    AuditRecord record = createTestRecord();
    when(auditRepository.findByEventId("event-123")).thenReturn(Mono.just(record));

    StepVerifier.create(auditService.findByEventId("event-123"))
        .expectNext(record)
        .verifyComplete();

    verify(auditRepository).findByEventId("event-123");
  }

  @Test
  void findByEventId_returnsEmptyWhenNotFound() {
    when(auditRepository.findByEventId("not-found")).thenReturn(Mono.empty());

    StepVerifier.create(auditService.findByEventId("not-found")).verifyComplete();
  }

  @Test
  void findByEntity_normalizesLimitToDefault() {
    AuditRecord record = createTestRecord();
    when(auditRepository.findByEntity(anyString(), anyString(), any(), any(), anyInt()))
        .thenReturn(Flux.just(record));

    StepVerifier.create(
            auditService.findByEntity("CART", "cart-123", TimeRange.unbounded(), null, 0))
        .expectNext(record)
        .verifyComplete();

    ArgumentCaptor<Integer> limitCaptor = ArgumentCaptor.forClass(Integer.class);
    verify(auditRepository)
        .findByEntity(
            eq("CART"), eq("cart-123"), any(TimeRange.class), isNull(), limitCaptor.capture());

    assertThat(limitCaptor.getValue()).isEqualTo(100); // Default limit
  }

  @Test
  void findByEntity_normalizesLimitToMax() {
    AuditRecord record = createTestRecord();
    when(auditRepository.findByEntity(anyString(), anyString(), any(), any(), anyInt()))
        .thenReturn(Flux.just(record));

    StepVerifier.create(
            auditService.findByEntity("CART", "cart-123", TimeRange.unbounded(), null, 5000))
        .expectNext(record)
        .verifyComplete();

    ArgumentCaptor<Integer> limitCaptor = ArgumentCaptor.forClass(Integer.class);
    verify(auditRepository)
        .findByEntity(
            eq("CART"), eq("cart-123"), any(TimeRange.class), isNull(), limitCaptor.capture());

    assertThat(limitCaptor.getValue()).isEqualTo(1000); // Max limit
  }

  @Test
  void findByEntity_preservesValidLimit() {
    AuditRecord record = createTestRecord();
    when(auditRepository.findByEntity(anyString(), anyString(), any(), any(), anyInt()))
        .thenReturn(Flux.just(record));

    StepVerifier.create(
            auditService.findByEntity("CART", "cart-123", TimeRange.unbounded(), null, 50))
        .expectNext(record)
        .verifyComplete();

    ArgumentCaptor<Integer> limitCaptor = ArgumentCaptor.forClass(Integer.class);
    verify(auditRepository)
        .findByEntity(
            eq("CART"), eq("cart-123"), any(TimeRange.class), isNull(), limitCaptor.capture());

    assertThat(limitCaptor.getValue()).isEqualTo(50);
  }

  @Test
  void findByEntity_normalizesNullTimeRange() {
    AuditRecord record = createTestRecord();
    when(auditRepository.findByEntity(anyString(), anyString(), any(), any(), anyInt()))
        .thenReturn(Flux.just(record));

    StepVerifier.create(auditService.findByEntity("CART", "cart-123", null, null, 100))
        .expectNext(record)
        .verifyComplete();

    ArgumentCaptor<TimeRange> timeRangeCaptor = ArgumentCaptor.forClass(TimeRange.class);
    verify(auditRepository)
        .findByEntity(eq("CART"), eq("cart-123"), timeRangeCaptor.capture(), isNull(), eq(100));

    assertThat(timeRangeCaptor.getValue().hasStart()).isFalse();
    assertThat(timeRangeCaptor.getValue().hasEnd()).isFalse();
  }

  @Test
  void findByUser_delegatesToRepository() {
    AuditRecord record = createTestRecord();
    TimeRange timeRange = TimeRange.since(Instant.parse("2024-01-01T00:00:00Z"));
    when(auditRepository.findByUser(anyString(), any(), anyInt())).thenReturn(Flux.just(record));

    StepVerifier.create(auditService.findByUser("user01", timeRange, 50))
        .expectNext(record)
        .verifyComplete();

    verify(auditRepository).findByUser(eq("user01"), eq(timeRange), eq(50));
  }

  @Test
  void findByStoreAndEntityType_delegatesToRepository() {
    AuditRecord record = createTestRecord();
    TimeRange timeRange = TimeRange.unbounded();
    when(auditRepository.findByStoreAndEntityType(anyInt(), anyString(), any(), any(), anyInt()))
        .thenReturn(Flux.just(record));

    StepVerifier.create(
            auditService.findByStoreAndEntityType(100, "CART", timeRange, "CART_CREATED", 100))
        .expectNext(record)
        .verifyComplete();

    verify(auditRepository)
        .findByStoreAndEntityType(eq(100), eq("CART"), eq(timeRange), eq("CART_CREATED"), eq(100));
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
    record.setCreatedAt(Instant.now());
    record.setData("{\"items\": 3}");
    return record;
  }
}
