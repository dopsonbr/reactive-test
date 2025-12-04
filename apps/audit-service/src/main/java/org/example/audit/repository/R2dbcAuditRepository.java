package org.example.audit.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.audit.domain.AuditRecord;
import org.example.audit.domain.TimeRange;
import org.example.platform.audit.AuditEvent;
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
    private final ObjectMapper objectMapper;

    public R2dbcAuditRepository(R2dbcEntityTemplate template, ObjectMapper objectMapper) {
        this.template = template;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<AuditEvent> save(AuditEvent event) {
        AuditRecord record = AuditRecord.fromEvent(event, objectMapper);
        return template.insert(record)
                .map(saved -> saved.toEvent(objectMapper))
                .doOnSuccess(
                        e ->
                                log.debug(
                                        "Saved audit event: eventId={}, eventType={}",
                                        e.eventId(),
                                        e.eventType()))
                .doOnError(
                        e ->
                                log.error(
                                        "Failed to save audit event: eventId={}, error={}",
                                        event.eventId(),
                                        e.getMessage()));
    }

    @Override
    public Mono<AuditEvent> findById(String eventId) {
        return template.selectOne(
                        Query.query(Criteria.where("event_id").is(eventId)), AuditRecord.class)
                .map(record -> record.toEvent(objectMapper));
    }

    @Override
    public Flux<AuditEvent> findByEntity(
            String entityType, String entityId, TimeRange timeRange, String eventType, int limit) {
        Criteria criteria =
                Criteria.where("entity_type").is(entityType).and("entity_id").is(entityId);

        criteria = addTimeRangeCriteria(criteria, timeRange);
        if (eventType != null) {
            criteria = criteria.and("event_type").is(eventType);
        }

        return template.select(
                        Query.query(criteria)
                                .sort(Sort.by(Sort.Direction.DESC, "created_at"))
                                .limit(limit),
                        AuditRecord.class)
                .map(record -> record.toEvent(objectMapper));
    }

    @Override
    public Flux<AuditEvent> findByUser(String userId, TimeRange timeRange, int limit) {
        Criteria criteria = Criteria.where("user_id").is(userId);
        criteria = addTimeRangeCriteria(criteria, timeRange);

        return template.select(
                        Query.query(criteria)
                                .sort(Sort.by(Sort.Direction.DESC, "created_at"))
                                .limit(limit),
                        AuditRecord.class)
                .map(record -> record.toEvent(objectMapper));
    }

    @Override
    public Flux<AuditEvent> findByStoreAndEntityType(
            int storeNumber, String entityType, TimeRange timeRange, String eventType, int limit) {
        Criteria criteria =
                Criteria.where("store_number").is(storeNumber).and("entity_type").is(entityType);

        criteria = addTimeRangeCriteria(criteria, timeRange);
        if (eventType != null) {
            criteria = criteria.and("event_type").is(eventType);
        }

        return template.select(
                        Query.query(criteria)
                                .sort(Sort.by(Sort.Direction.DESC, "created_at"))
                                .limit(limit),
                        AuditRecord.class)
                .map(record -> record.toEvent(objectMapper));
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
