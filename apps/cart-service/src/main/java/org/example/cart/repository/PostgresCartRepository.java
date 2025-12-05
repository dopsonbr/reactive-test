package org.example.cart.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.example.cart.model.Cart;
import org.example.cart.model.CartTotals;
import org.example.model.customer.CartCustomer;
import org.example.model.discount.AppliedDiscount;
import org.example.model.fulfillment.Fulfillment;
import org.example.model.product.CartProduct;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Postgres implementation of CartRepository.
 *
 * <p>Converts between domain Cart objects and CartEntity database records, handling JSON
 * serialization for nested collections.
 */
@Repository
public class PostgresCartRepository implements CartRepository {

  private final CartEntityRepository entityRepository;
  private final ObjectMapper objectMapper;

  public PostgresCartRepository(CartEntityRepository entityRepository, ObjectMapper objectMapper) {
    this.entityRepository = entityRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public Mono<Cart> findById(String cartId) {
    return Mono.fromCallable(() -> UUID.fromString(cartId))
        .flatMap(entityRepository::findById)
        .flatMap(this::toDomain);
  }

  @Override
  public Flux<Cart> findByStoreNumber(int storeNumber) {
    return entityRepository.findByStoreNumber(storeNumber).flatMap(this::toDomain);
  }

  @Override
  public Flux<Cart> findByCustomerId(String customerId) {
    return entityRepository.findByCustomerId(customerId).flatMap(this::toDomain);
  }

  @Override
  public Mono<Cart> save(Cart cart) {
    return toEntity(cart).flatMap(entityRepository::save).flatMap(this::toDomain);
  }

  @Override
  public Mono<Void> deleteById(String cartId) {
    return Mono.fromCallable(() -> UUID.fromString(cartId)).flatMap(entityRepository::deleteById);
  }

  @Override
  public Mono<Boolean> exists(String cartId) {
    return Mono.fromCallable(() -> UUID.fromString(cartId)).flatMap(entityRepository::existsById);
  }

  // ==================== Mapping Methods ====================

  private Mono<Cart> toDomain(CartEntity entity) {
    return Mono.fromCallable(
        () -> {
          CartCustomer customer =
              deserialize(entity.customerJson(), new TypeReference<CartCustomer>() {});
          List<CartProduct> products =
              deserialize(entity.productsJson(), new TypeReference<List<CartProduct>>() {});
          List<AppliedDiscount> discounts =
              deserialize(entity.discountsJson(), new TypeReference<List<AppliedDiscount>>() {});
          List<Fulfillment> fulfillments =
              deserialize(entity.fulfillmentsJson(), new TypeReference<List<Fulfillment>>() {});
          CartTotals totals = deserialize(entity.totalsJson(), new TypeReference<CartTotals>() {});

          return new Cart(
              entity.id().toString(),
              entity.storeNumber(),
              entity.customerId(),
              customer,
              products != null ? products : new ArrayList<>(),
              discounts != null ? discounts : new ArrayList<>(),
              fulfillments != null ? fulfillments : new ArrayList<>(),
              totals != null ? totals : CartTotals.empty(),
              entity.createdAt(),
              entity.updatedAt());
        });
  }

  private Mono<CartEntity> toEntity(Cart cart) {
    return Mono.fromCallable(
        () ->
            new CartEntity(
                UUID.fromString(cart.id()),
                cart.storeNumber(),
                cart.customerId(),
                serialize(cart.customer()),
                serialize(cart.products()),
                serialize(cart.discounts()),
                serialize(cart.fulfillments()),
                serialize(cart.totals()),
                cart.createdAt(),
                cart.updatedAt()));
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
