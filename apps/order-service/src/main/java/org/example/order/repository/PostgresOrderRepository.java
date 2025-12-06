package org.example.order.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.example.order.model.AppliedDiscount;
import org.example.order.model.CustomerSnapshot;
import org.example.order.model.FulfillmentDetails;
import org.example.order.model.FulfillmentType;
import org.example.order.model.Order;
import org.example.order.model.OrderLineItem;
import org.example.order.model.OrderStatus;
import org.example.order.model.PaymentStatus;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Postgres implementation of OrderRepository.
 *
 * <p>Converts between domain Order objects and OrderEntity database records, handling JSON
 * serialization for denormalized collections. Provides read and update access only (no inserts).
 */
@Repository
public class PostgresOrderRepository implements OrderRepository {

  private final OrderEntityRepository entityRepository;
  private final ObjectMapper objectMapper;

  public PostgresOrderRepository(
      OrderEntityRepository entityRepository, ObjectMapper objectMapper) {
    this.entityRepository = entityRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public Mono<Order> findById(UUID orderId) {
    return entityRepository.findById(orderId).flatMap(this::toDomain);
  }

  @Override
  public Mono<Order> findByOrderNumber(String orderNumber) {
    return entityRepository.findByOrderNumber(orderNumber).flatMap(this::toDomain);
  }

  @Override
  public Flux<Order> findByStoreNumber(int storeNumber) {
    return entityRepository.findByStoreNumber(storeNumber).flatMap(this::toDomain);
  }

  @Override
  public Flux<Order> findByCustomerId(String customerId) {
    return entityRepository.findByCustomerId(customerId).flatMap(this::toDomain);
  }

  @Override
  public Flux<Order> findByStoreNumberAndStatus(int storeNumber, OrderStatus status) {
    return entityRepository
        .findByStoreNumberAndStatus(storeNumber, status.name())
        .flatMap(this::toDomain);
  }

  @Override
  public Flux<Order> searchOrders(
      int storeNumber, Instant startDate, Instant endDate, int limit, int offset) {
    return entityRepository
        .searchOrders(storeNumber, startDate, endDate, limit, offset)
        .flatMap(this::toDomain);
  }

  @Override
  public Mono<Long> countSearchOrders(int storeNumber, Instant startDate, Instant endDate) {
    return entityRepository.countSearchOrders(storeNumber, startDate, endDate);
  }

  @Override
  public Mono<Order> update(Order order) {
    return toEntity(order).flatMap(entityRepository::save).flatMap(this::toDomain);
  }

  @Override
  public Mono<Boolean> exists(UUID orderId) {
    return entityRepository.existsById(orderId);
  }

  // ==================== Mapping Methods ====================

  private Mono<Order> toDomain(OrderEntity entity) {
    return Mono.fromCallable(() -> toDomainSync(entity));
  }

  private Order toDomainSync(OrderEntity entity) {
    try {
      List<OrderLineItem> lineItems =
          deserialize(
              JsonValue.unwrap(entity.lineItems()), new TypeReference<List<OrderLineItem>>() {});
      List<AppliedDiscount> appliedDiscounts =
          deserialize(
              JsonValue.unwrap(entity.appliedDiscounts()),
              new TypeReference<List<AppliedDiscount>>() {});
      CustomerSnapshot customerSnapshot =
          deserialize(
              JsonValue.unwrap(entity.customerSnapshot()),
              new TypeReference<CustomerSnapshot>() {});
      FulfillmentDetails fulfillmentDetails =
          deserialize(
              JsonValue.unwrap(entity.fulfillmentDetails()),
              new TypeReference<FulfillmentDetails>() {});

      return Order.builder()
          .id(entity.id())
          .storeNumber(entity.storeNumber())
          .orderNumber(entity.orderNumber())
          .customerId(entity.customerId())
          .fulfillmentType(
              entity.fulfillmentType() != null
                  ? FulfillmentType.valueOf(entity.fulfillmentType())
                  : null)
          .fulfillmentDate(entity.fulfillmentDate())
          .reservationId(entity.reservationId())
          .subtotal(entity.subtotal())
          .discountTotal(entity.discountTotal())
          .taxTotal(entity.taxTotal())
          .fulfillmentCost(entity.fulfillmentCost())
          .grandTotal(entity.grandTotal())
          .paymentStatus(
              entity.paymentStatus() != null
                  ? PaymentStatus.valueOf(entity.paymentStatus())
                  : PaymentStatus.PENDING)
          .paymentMethod(entity.paymentMethod())
          .paymentReference(entity.paymentReference())
          .status(
              entity.status() != null ? OrderStatus.valueOf(entity.status()) : OrderStatus.CREATED)
          .lineItems(lineItems != null ? lineItems : new ArrayList<>())
          .appliedDiscounts(appliedDiscounts != null ? appliedDiscounts : new ArrayList<>())
          .customerSnapshot(customerSnapshot)
          .fulfillmentDetails(fulfillmentDetails)
          .createdAt(entity.createdAt())
          .updatedAt(entity.updatedAt())
          .createdBy(entity.createdBy())
          .sessionId(entity.sessionId())
          .build();
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to deserialize order entity", e);
    }
  }

  private Mono<OrderEntity> toEntity(Order order) {
    return Mono.fromCallable(
        () ->
            OrderEntity.existing(
                order.id(),
                order.storeNumber(),
                order.orderNumber(),
                order.customerId(),
                order.fulfillmentType() != null ? order.fulfillmentType().name() : null,
                order.fulfillmentDate(),
                order.reservationId(),
                order.subtotal(),
                order.discountTotal(),
                order.taxTotal(),
                order.fulfillmentCost(),
                order.grandTotal(),
                order.paymentStatus() != null ? order.paymentStatus().name() : null,
                order.paymentMethod(),
                order.paymentReference(),
                order.status() != null ? order.status().name() : null,
                serialize(order.lineItems()),
                serialize(order.appliedDiscounts()),
                serialize(order.customerSnapshot()),
                serialize(order.fulfillmentDetails()),
                order.createdAt(),
                order.updatedAt(),
                order.createdBy(),
                order.sessionId()));
  }

  private <T> T deserialize(String json, TypeReference<T> typeRef) throws JsonProcessingException {
    if (json == null || json.isBlank()) {
      return null;
    }
    return objectMapper.readValue(json, typeRef);
  }

  private String serialize(Object obj) throws JsonProcessingException {
    if (obj == null) {
      return null;
    }
    return objectMapper.writeValueAsString(obj);
  }
}
