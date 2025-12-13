package org.example.audit.repository;

import org.example.audit.domain.AuditRecord;
import org.example.audit.domain.TimeRange;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** R2DBC implementation of the AuditRepository. */
@Repository
public class R2dbcAuditRepository implements AuditRepository {

  private static final Logger log = LoggerFactory.getLogger(R2dbcAuditRepository.class);

  private final R2dbcEntityTemplate template;

  public R2dbcAuditRepository(R2dbcEntityTemplate template) {
    this.template = template;
  }

  @Override
  public Mono<AuditRecord> saveRecord(AuditRecord record) {
    return template
        .insert(record)
        .doOnSuccess(r -> log.debug("Saved audit record: eventId={}", r.eventId()))
        .doOnError(
            e ->
                log.error(
                    "Failed to save audit record: eventId={}, error={}",
                    record.eventId(),
                    e.getMessage()));
  }

  @Override
  public Mono<AuditRecord> findByEventId(String eventId) {
    return template.selectOne(
        Query.query(Criteria.where("event_id").is(eventId)), AuditRecord.class);
  }

  @Override
  public Flux<AuditRecord> findByEntity(
      String entityType, String entityId, TimeRange timeRange, String eventType, int limit) {
    Criteria criteria = Criteria.where("entity_type").is(entityType).and("entity_id").is(entityId);

    criteria = addTimeRangeCriteria(criteria, timeRange);
    if (eventType != null) {
      criteria = criteria.and("event_type").is(eventType);
    }

    return template.select(
        Query.query(criteria).sort(Sort.by(Sort.Direction.DESC, "created_at")).limit(limit),
        AuditRecord.class);
  }

  @Override
  public Flux<AuditRecord> findByUser(String userId, TimeRange timeRange, int limit) {
    Criteria criteria = Criteria.where("user_id").is(userId);
    criteria = addTimeRangeCriteria(criteria, timeRange);

    return template.select(
        Query.query(criteria).sort(Sort.by(Sort.Direction.DESC, "created_at")).limit(limit),
        AuditRecord.class);
  }

  @Override
  public Flux<AuditRecord> findByStoreAndEntityType(
      int storeNumber, String entityType, TimeRange timeRange, String eventType, int limit) {
    Criteria criteria =
        Criteria.where("store_number").is(storeNumber).and("entity_type").is(entityType);

    criteria = addTimeRangeCriteria(criteria, timeRange);
    if (eventType != null) {
      criteria = criteria.and("event_type").is(eventType);
    }

    return template.select(
        Query.query(criteria).sort(Sort.by(Sort.Direction.DESC, "created_at")).limit(limit),
        AuditRecord.class);
  }

  private Criteria addTimeRangeCriteria(Criteria criteria, TimeRange timeRange) {
    if (timeRange.hasStart()) {
      criteria = criteria.and("created_at").greaterThanOrEquals(timeRange.start());
    }
    if (timeRange.hasEnd()) {
      criteria = criteria.and("created_at").lessThan(timeRange.end());
    }
    return criteria;
  }
}
