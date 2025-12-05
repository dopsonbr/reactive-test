package org.example.customer.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.model.customer.Address;
import org.example.model.customer.B2BInfo;
import org.example.model.customer.CommunicationPreferences;
import org.example.model.customer.Customer;
import org.example.model.customer.CustomerStatus;
import org.example.model.customer.CustomerType;
import org.example.model.customer.LoyaltyInfo;
import org.example.model.customer.LoyaltyTier;
import org.example.model.customer.WalletReference;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** PostgreSQL implementation of CustomerRepository using R2DBC. */
@Repository
public class PostgresCustomerRepository implements CustomerRepository {

  private static final TypeReference<List<Address>> ADDRESS_LIST_TYPE = new TypeReference<>() {};

  private final CustomerEntityRepository entityRepository;
  private final ObjectMapper objectMapper;

  public PostgresCustomerRepository(
      CustomerEntityRepository entityRepository, ObjectMapper objectMapper) {
    this.entityRepository = entityRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public Mono<Customer> findById(String customerId) {
    return entityRepository.findByCustomerId(customerId).flatMap(this::toDomain);
  }

  @Override
  public Mono<Customer> findByEmail(int storeNumber, String email) {
    return entityRepository.findByStoreNumberAndEmail(storeNumber, email).flatMap(this::toDomain);
  }

  @Override
  public Mono<Customer> findByPhone(int storeNumber, String phone) {
    return entityRepository.findByStoreNumberAndPhone(storeNumber, phone).flatMap(this::toDomain);
  }

  @Override
  public Flux<Customer> findByStore(int storeNumber) {
    return entityRepository.findByStoreNumber(storeNumber).flatMap(this::toDomain);
  }

  @Override
  public Flux<Customer> findByStoreAndType(int storeNumber, CustomerType type) {
    return entityRepository
        .findByStoreNumberAndCustomerType(storeNumber, type.name())
        .flatMap(this::toDomain);
  }

  @Override
  public Flux<Customer> findChildAccounts(String parentCustomerId) {
    return entityRepository.findByParentCustomerId(parentCustomerId).flatMap(this::toDomain);
  }

  @Override
  public Flux<Customer> search(int storeNumber, String searchTerm) {
    return entityRepository.searchByIdEmailOrPhone(storeNumber, searchTerm).flatMap(this::toDomain);
  }

  @Override
  public Flux<Customer> findActiveByStore(int storeNumber, int page, int size) {
    int offset = page * size;
    return entityRepository
        .findActiveByStorePaginated(storeNumber, size, offset)
        .flatMap(this::toDomain);
  }

  @Override
  public Mono<Customer> save(Customer customer) {
    return toEntity(customer).flatMap(entityRepository::save).flatMap(this::toDomain);
  }

  @Override
  public Mono<Void> deleteById(String customerId) {
    return entityRepository
        .findByCustomerId(customerId)
        .flatMap(entity -> entityRepository.deleteById(entity.id()));
  }

  @Override
  public Mono<Boolean> exists(String customerId) {
    return entityRepository.findByCustomerId(customerId).hasElement();
  }

  @Override
  public Mono<Boolean> existsByEmail(int storeNumber, String email) {
    return entityRepository.existsByStoreNumberAndEmail(storeNumber, email);
  }

  @Override
  public Mono<Long> countByStore(int storeNumber) {
    return entityRepository.countByStoreNumber(storeNumber);
  }

  @Override
  public Mono<Long> countByStoreAndType(int storeNumber, CustomerType type) {
    return entityRepository.countByStoreNumberAndCustomerType(storeNumber, type.name());
  }

  @Override
  public Flux<Customer> findByLoyaltyTier(int storeNumber, LoyaltyTier tier) {
    return entityRepository
        .findByStoreNumberAndLoyaltyTier(storeNumber, tier.name())
        .flatMap(this::toDomain);
  }

  private Mono<Customer> toDomain(CustomerEntity entity) {
    return Mono.fromCallable(
        () -> {
          List<Address> addresses = deserialize(entity.addressesJson(), ADDRESS_LIST_TYPE);
          WalletReference wallet = deserialize(entity.walletJson(), WalletReference.class);
          CommunicationPreferences commPrefs =
              deserialize(entity.communicationPrefsJson(), CommunicationPreferences.class);
          LoyaltyInfo loyalty = deserialize(entity.loyaltyJson(), LoyaltyInfo.class);
          B2BInfo b2bInfo = deserialize(entity.b2bInfoJson(), B2BInfo.class);

          return new Customer(
              entity.customerId(),
              entity.storeNumber(),
              entity.name(),
              entity.email(),
              entity.phone(),
              CustomerType.valueOf(entity.customerType()),
              CustomerStatus.valueOf(entity.status()),
              addresses != null ? addresses : List.of(),
              wallet,
              commPrefs,
              loyalty,
              b2bInfo,
              entity.createdAt(),
              entity.updatedAt());
        });
  }

  private Mono<CustomerEntity> toEntity(Customer customer) {
    return Mono.fromCallable(
        () -> {
          UUID id = UUID.randomUUID();
          String parentCustomerId =
              customer.b2bInfo() != null ? customer.b2bInfo().parentCustomerId() : null;

          return new CustomerEntity(
              id,
              customer.storeNumber(),
              customer.customerId(),
              customer.name(),
              customer.email(),
              customer.phone(),
              customer.type().name(),
              customer.status().name(),
              parentCustomerId,
              serialize(customer.addresses()),
              serialize(customer.wallet()),
              serialize(customer.communicationPreferences()),
              serialize(customer.loyalty()),
              serialize(customer.b2bInfo()),
              customer.createdAt() != null ? customer.createdAt() : Instant.now(),
              Instant.now());
        });
  }

  private <T> T deserialize(String json, Class<T> type) {
    if (json == null || json.isBlank() || "{}".equals(json)) {
      return null;
    }
    try {
      return objectMapper.readValue(json, type);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to deserialize JSON to " + type.getSimpleName(), e);
    }
  }

  private <T> T deserialize(String json, TypeReference<T> typeRef) {
    if (json == null || json.isBlank() || "[]".equals(json)) {
      return null;
    }
    try {
      return objectMapper.readValue(json, typeRef);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to deserialize JSON", e);
    }
  }

  private String serialize(Object obj) {
    if (obj == null) {
      return null;
    }
    try {
      return objectMapper.writeValueAsString(obj);
    } catch (JsonProcessingException e) {
      throw new RuntimeException(
          "Failed to serialize " + obj.getClass().getSimpleName() + " to JSON", e);
    }
  }
}
