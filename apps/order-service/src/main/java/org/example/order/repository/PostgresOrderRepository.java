package org.example.order.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.example.model.order.AppliedDiscount;
import org.example.model.order.CustomerSnapshot;
import org.example.model.order.FulfillmentDetails;
import org.example.model.order.FulfillmentType;
import org.example.model.order.Order;
import org.example.model.order.OrderLineItem;
import org.example.model.order.OrderStatus;
import org.example.model.order.PaymentStatus;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Postgres implementation of OrderRepository.
 *
 * <p>Converts between domain Order objects and OrderEntity database records, handling JSON
 * serialization for denormalized collections.
 */
@Repository
public class PostgresOrderRepository implements OrderRepository {

  private final OrderEntityRepository entityRepository;
  private final DatabaseClient databaseClient;
  private final ObjectMapper objectMapper;

  public PostgresOrderRepository(
      OrderEntityRepository entityRepository,
      DatabaseClient databaseClient,
      ObjectMapper objectMapper) {
    this.entityRepository = entityRepository;
    this.databaseClient = databaseClient;
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

  @Override
  public Mono<Boolean> insertIfAbsent(Order order) {
    return Mono.fromCallable(() -> serializeOrder(order))
        .flatMap(params -> executeInsert(order, params));
  }

  private Mono<Boolean> executeInsert(Order order, OrderInsertParams params) {
    var spec =
        databaseClient
            .sql(INSERT_IF_ABSENT_SQL)
            .bind("id", params.id())
            .bind("storeNumber", params.storeNumber())
            .bind("orderNumber", params.orderNumber());

    // Handle nullable fields
    spec = bindOptional(spec, "customerId", order.customerId(), String.class);
    spec = spec.bind("fulfillmentType", params.fulfillmentType());
    spec = bindOptional(spec, "fulfillmentDate", order.fulfillmentDate(), java.time.Instant.class);
    spec = bindOptional(spec, "reservationId", order.reservationId(), UUID.class);

    spec =
        spec.bind("subtotal", params.subtotal())
            .bind("discountTotal", params.discountTotal())
            .bind("taxTotal", params.taxTotal())
            .bind("fulfillmentCost", params.fulfillmentCost())
            .bind("grandTotal", params.grandTotal())
            .bind("paymentStatus", params.paymentStatus());

    spec = bindOptional(spec, "paymentMethod", order.paymentMethod(), String.class);
    spec = bindOptional(spec, "paymentReference", order.paymentReference(), String.class);

    spec =
        spec.bind("status", params.status())
            .bind("lineItems", io.r2dbc.postgresql.codec.Json.of(params.lineItemsJson()))
            .bind(
                "appliedDiscounts",
                io.r2dbc.postgresql.codec.Json.of(params.appliedDiscountsJson()));

    spec = bindOptionalJson(spec, "customerSnapshot", params.customerSnapshotJson());
    spec = bindOptionalJson(spec, "fulfillmentDetails", params.fulfillmentDetailsJson());

    spec = spec.bind("createdAt", params.createdAt()).bind("updatedAt", params.updatedAt());
    spec = bindOptional(spec, "createdBy", order.createdBy(), String.class);
    spec = bindOptional(spec, "sessionId", order.sessionId(), UUID.class);

    return spec.fetch().rowsUpdated().map(rowsUpdated -> rowsUpdated > 0);
  }

  @SuppressWarnings("unchecked")
  private <T> DatabaseClient.GenericExecuteSpec bindOptional(
      DatabaseClient.GenericExecuteSpec spec, String name, T value, Class<T> type) {
    if (value != null) {
      return spec.bind(name, value);
    }
    return spec.bindNull(name, type);
  }

  private DatabaseClient.GenericExecuteSpec bindOptionalJson(
      DatabaseClient.GenericExecuteSpec spec, String name, String jsonValue) {
    if (jsonValue != null) {
      return spec.bind(name, io.r2dbc.postgresql.codec.Json.of(jsonValue));
    }
    return spec.bindNull(name, io.r2dbc.postgresql.codec.Json.class);
  }

  private static final String INSERT_IF_ABSENT_SQL =
      """
      INSERT INTO orders (
        id, store_number, order_number, customer_id,
        fulfillment_type, fulfillment_date, reservation_id,
        subtotal, discount_total, tax_total, fulfillment_cost, grand_total,
        payment_status, payment_method, payment_reference,
        status, line_items, applied_discounts, customer_snapshot, fulfillment_details,
        created_at, updated_at, created_by, session_id
      ) VALUES (
        :id, :storeNumber, :orderNumber, :customerId,
        :fulfillmentType, :fulfillmentDate, :reservationId,
        :subtotal, :discountTotal, :taxTotal, :fulfillmentCost, :grandTotal,
        :paymentStatus, :paymentMethod, :paymentReference,
        :status, :lineItems, :appliedDiscounts, :customerSnapshot, :fulfillmentDetails,
        :createdAt, :updatedAt, :createdBy, :sessionId
      )
      ON CONFLICT (id) DO NOTHING
      """;

  /** Serialized order parameters for database insert. */
  private record OrderInsertParams(
      UUID id,
      int storeNumber,
      String orderNumber,
      String fulfillmentType,
      java.math.BigDecimal subtotal,
      java.math.BigDecimal discountTotal,
      java.math.BigDecimal taxTotal,
      java.math.BigDecimal fulfillmentCost,
      java.math.BigDecimal grandTotal,
      String paymentStatus,
      String status,
      String lineItemsJson,
      String appliedDiscountsJson,
      String customerSnapshotJson,
      String fulfillmentDetailsJson,
      java.time.Instant createdAt,
      java.time.Instant updatedAt) {}

  private OrderInsertParams serializeOrder(Order order) throws JsonProcessingException {
    return new OrderInsertParams(
        order.id(),
        order.storeNumber(),
        order.orderNumber(),
        order.fulfillmentType() != null ? order.fulfillmentType().name() : "IMMEDIATE",
        order.subtotal() != null ? order.subtotal() : java.math.BigDecimal.ZERO,
        order.discountTotal() != null ? order.discountTotal() : java.math.BigDecimal.ZERO,
        order.taxTotal() != null ? order.taxTotal() : java.math.BigDecimal.ZERO,
        order.fulfillmentCost() != null ? order.fulfillmentCost() : java.math.BigDecimal.ZERO,
        order.grandTotal() != null ? order.grandTotal() : java.math.BigDecimal.ZERO,
        order.paymentStatus() != null ? order.paymentStatus().name() : "PENDING",
        order.status() != null ? order.status().name() : "CREATED",
        serialize(order.lineItems() != null ? order.lineItems() : new ArrayList<>()),
        serialize(order.appliedDiscounts() != null ? order.appliedDiscounts() : new ArrayList<>()),
        order.customerSnapshot() != null ? serialize(order.customerSnapshot()) : null,
        order.fulfillmentDetails() != null ? serialize(order.fulfillmentDetails()) : null,
        order.createdAt() != null ? order.createdAt() : java.time.Instant.now(),
        order.updatedAt() != null ? order.updatedAt() : java.time.Instant.now());
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
