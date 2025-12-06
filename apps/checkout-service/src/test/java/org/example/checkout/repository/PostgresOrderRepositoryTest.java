package org.example.checkout.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.checkout.AbstractIntegrationTest;
import org.example.checkout.config.TestR2dbcConfig;
import org.example.checkout.model.AppliedDiscount;
import org.example.checkout.model.CustomerSnapshot;
import org.example.checkout.model.FulfillmentDetails;
import org.example.checkout.model.FulfillmentType;
import org.example.checkout.model.Order;
import org.example.checkout.model.OrderLineItem;
import org.example.checkout.model.OrderStatus;
import org.example.checkout.model.PaymentStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import reactor.test.StepVerifier;

/** Integration tests for PostgresOrderRepository. */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestR2dbcConfig.class)
class PostgresOrderRepositoryTest extends AbstractIntegrationTest {

  @Autowired private OrderRepository orderRepository;

  @Autowired private OrderEntityRepository entityRepository;

  @BeforeEach
  void setUp() {
    // Clean up before each test
    entityRepository.deleteAll().block();
  }

  @Test
  void shouldSaveAndRetrieveOrder() {
    // Given
    Order order = createTestOrder();

    // When
    StepVerifier.create(orderRepository.save(order))
        .assertNext(
            saved -> {
              assertThat(saved.id()).isEqualTo(order.id());
              assertThat(saved.orderNumber()).isEqualTo(order.orderNumber());
              assertThat(saved.storeNumber()).isEqualTo(order.storeNumber());
              assertThat(saved.status()).isEqualTo(OrderStatus.CREATED);
            })
        .verifyComplete();

    // Then
    StepVerifier.create(orderRepository.findById(order.id()))
        .assertNext(
            retrieved -> {
              assertThat(retrieved.id()).isEqualTo(order.id());
              assertThat(retrieved.orderNumber()).isEqualTo(order.orderNumber());
              assertThat(retrieved.lineItems()).hasSize(2);
              assertThat(retrieved.appliedDiscounts()).hasSize(1);
              assertThat(retrieved.customerSnapshot()).isNotNull();
              assertThat(retrieved.customerSnapshot().firstName()).isEqualTo("John");
            })
        .verifyComplete();
  }

  @Test
  void shouldFindOrderByOrderNumber() {
    // Given
    Order order = createTestOrder();
    orderRepository.save(order).block();

    // When/Then
    StepVerifier.create(orderRepository.findByOrderNumber(order.orderNumber()))
        .assertNext(
            retrieved -> {
              assertThat(retrieved.id()).isEqualTo(order.id());
              assertThat(retrieved.orderNumber()).isEqualTo(order.orderNumber());
            })
        .verifyComplete();
  }

  @Test
  void shouldFindOrdersByStoreNumber() {
    // Given
    Order order1 = createTestOrder();
    Order order2 =
        Order.builder()
            .id(UUID.randomUUID())
            .storeNumber(100)
            .orderNumber("ORD-002")
            .status(OrderStatus.CREATED)
            .fulfillmentType(FulfillmentType.IMMEDIATE)
            .paymentStatus(PaymentStatus.PENDING)
            .subtotal(new BigDecimal("50.00"))
            .discountTotal(BigDecimal.ZERO)
            .taxTotal(new BigDecimal("4.00"))
            .fulfillmentCost(BigDecimal.ZERO)
            .grandTotal(new BigDecimal("54.00"))
            .lineItems(List.of())
            .appliedDiscounts(List.of())
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();

    orderRepository.save(order1).block();
    orderRepository.save(order2).block();

    // When/Then
    StepVerifier.create(orderRepository.findByStoreNumber(100)).expectNextCount(2).verifyComplete();
  }

  @Test
  void shouldUpdateOrderStatus() {
    // Given
    Order order = createTestOrder();
    orderRepository.save(order).block();

    // When
    StepVerifier.create(orderRepository.updateStatus(order.id(), "PAID"))
        .assertNext(
            updated -> {
              assertThat(updated.status()).isEqualTo(OrderStatus.PAID);
              assertThat(updated.updatedAt()).isAfter(order.updatedAt());
            })
        .verifyComplete();
  }

  @Test
  void shouldCheckIfOrderExists() {
    // Given
    Order order = createTestOrder();
    orderRepository.save(order).block();

    // When/Then
    StepVerifier.create(orderRepository.exists(order.id()))
        .assertNext(exists -> assertThat(exists).isTrue())
        .verifyComplete();

    StepVerifier.create(orderRepository.exists(UUID.randomUUID()))
        .assertNext(exists -> assertThat(exists).isFalse())
        .verifyComplete();
  }

  private Order createTestOrder() {
    return Order.builder()
        .id(UUID.randomUUID())
        .storeNumber(100)
        .orderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8))
        .customerId("CUST-001")
        .fulfillmentType(FulfillmentType.IMMEDIATE)
        .status(OrderStatus.CREATED)
        .paymentStatus(PaymentStatus.PENDING)
        .subtotal(new BigDecimal("100.00"))
        .discountTotal(new BigDecimal("10.00"))
        .taxTotal(new BigDecimal("7.20"))
        .fulfillmentCost(BigDecimal.ZERO)
        .grandTotal(new BigDecimal("97.20"))
        .lineItems(
            List.of(
                OrderLineItem.create(
                    "PROD-001",
                    "123456",
                    "Test Product 1",
                    2,
                    new BigDecimal("30.00"),
                    BigDecimal.ZERO),
                OrderLineItem.create(
                    "PROD-002",
                    "789012",
                    "Test Product 2",
                    1,
                    new BigDecimal("40.00"),
                    BigDecimal.ZERO)))
        .appliedDiscounts(
            List.of(
                new AppliedDiscount(
                    "DISC-001", "SAVE10", "10% off", "PERCENTAGE", new BigDecimal("10.00"))))
        .customerSnapshot(
            new CustomerSnapshot("CUST-001", "John", "Doe", "john@example.com", "555-1234", "GOLD"))
        .fulfillmentDetails(
            new FulfillmentDetails(
                FulfillmentType.IMMEDIATE, null, null, "Store 100 - Main Entrance", null))
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .createdBy("testuser")
        .sessionId(UUID.randomUUID())
        .build();
  }
}
