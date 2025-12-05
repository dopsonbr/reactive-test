package org.example.customer.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.example.customer.controller.dto.CreateCustomerRequest;
import org.example.customer.controller.dto.UpdateCustomerRequest;
import org.example.customer.exception.BusinessRuleException;
import org.example.customer.exception.CustomerNotFoundException;
import org.example.customer.exception.DuplicateCustomerException;
import org.example.customer.repository.CustomerRepository;
import org.example.model.customer.AccountTier;
import org.example.model.customer.B2BInfo;
import org.example.model.customer.Customer;
import org.example.model.customer.CustomerStatus;
import org.example.model.customer.CustomerType;
import org.example.model.customer.LoyaltyTier;
import org.example.platform.logging.StructuredLogger;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.context.ContextView;

/** Service layer for customer operations. */
@Service
public class CustomerService {

  private static final String LOGGER_NAME = "customerservice";

  private final CustomerRepository repository;
  private final StructuredLogger logger;

  public CustomerService(CustomerRepository repository, StructuredLogger logger) {
    this.repository = repository;
    this.logger = logger;
  }

  // === CRUD Operations ===

  public Mono<Customer> getCustomer(String customerId) {
    return repository
        .findById(customerId)
        .switchIfEmpty(Mono.error(new CustomerNotFoundException(customerId)));
  }

  public Mono<Customer> createCustomer(ContextView ctx, CreateCustomerRequest request) {
    return repository
        .existsByEmail(request.storeNumber(), request.email())
        .flatMap(
            exists -> {
              if (exists) {
                return Mono.error(
                    new DuplicateCustomerException(request.storeNumber(), request.email()));
              }
              return Mono.fromCallable(() -> buildCustomer(request));
            })
        .flatMap(repository::save)
        .doOnSuccess(
            c ->
                logger.logMessage(
                    ctx,
                    LOGGER_NAME,
                    String.format(
                        "Customer created: customerId=%s, type=%s", c.customerId(), c.type())));
  }

  public Mono<Customer> updateCustomer(
      ContextView ctx, String customerId, UpdateCustomerRequest request) {
    return repository
        .findById(customerId)
        .switchIfEmpty(Mono.error(new CustomerNotFoundException(customerId)))
        .map(existing -> applyUpdates(existing, request))
        .flatMap(repository::save)
        .doOnSuccess(
            c ->
                logger.logMessage(
                    ctx,
                    LOGGER_NAME,
                    String.format("Customer updated: customerId=%s", c.customerId())));
  }

  public Mono<Void> deleteCustomer(ContextView ctx, String customerId) {
    return repository
        .findById(customerId)
        .switchIfEmpty(Mono.error(new CustomerNotFoundException(customerId)))
        .flatMap(
            customer -> {
              if (customer.isB2B()
                  && customer.b2bInfo() != null
                  && customer.b2bInfo().hasSubAccounts()) {
                return Mono.error(
                    new BusinessRuleException(
                        "Cannot delete B2B account with active" + " sub-accounts"));
              }
              return repository.deleteById(customerId);
            })
        .doOnSuccess(
            v ->
                logger.logMessage(
                    ctx,
                    LOGGER_NAME,
                    String.format("Customer deleted: customerId=%s", customerId)));
  }

  // === Search Operations ===

  public Mono<Customer> searchByEmail(int storeNumber, String email) {
    return repository.findByEmail(storeNumber, email);
  }

  public Mono<Customer> searchByPhone(int storeNumber, String phone) {
    return repository.findByPhone(storeNumber, phone);
  }

  public Flux<Customer> search(int storeNumber, String searchTerm) {
    return repository.search(storeNumber, searchTerm);
  }

  public Flux<Customer> findActiveByStore(int storeNumber, int page, int size) {
    return repository.findActiveByStore(storeNumber, page, size);
  }

  public Flux<Customer> findByLoyaltyTier(int storeNumber, LoyaltyTier tier) {
    return repository.findByLoyaltyTier(storeNumber, tier);
  }

  // === B2B Hierarchy Operations ===

  public Flux<Customer> getSubAccounts(String parentCustomerId) {
    return repository
        .findById(parentCustomerId)
        .filter(Customer::isB2B)
        .switchIfEmpty(
            Mono.error(new BusinessRuleException("Only B2B accounts can have sub-accounts")))
        .flatMapMany(parent -> repository.findChildAccounts(parentCustomerId));
  }

  public Mono<Customer> createSubAccount(
      ContextView ctx, String parentCustomerId, CreateCustomerRequest request) {
    return repository
        .findById(parentCustomerId)
        .filter(Customer::isB2B)
        .switchIfEmpty(Mono.error(new BusinessRuleException("Parent must be a B2B account")))
        .flatMap(
            parent -> {
              Customer subAccount = buildSubAccount(parent, request);
              return repository.save(subAccount);
            })
        .doOnSuccess(
            c ->
                logger.logMessage(
                    ctx,
                    LOGGER_NAME,
                    String.format(
                        "Sub-account created: customerId=%s, parentId=%s",
                        c.customerId(), parentCustomerId)));
  }

  // === Helper Methods ===

  private Customer buildCustomer(CreateCustomerRequest request) {
    String customerId = UUID.randomUUID().toString();
    Instant now = Instant.now();

    B2BInfo b2bInfo =
        request.type() == CustomerType.BUSINESS
            ? new B2BInfo(null, request.companyInfo(), List.of(), AccountTier.STANDARD, null)
            : null;

    return new Customer(
        customerId,
        request.storeNumber(),
        request.name(),
        request.email(),
        request.phone(),
        request.type(),
        CustomerStatus.ACTIVE,
        request.addresses() != null ? request.addresses() : List.of(),
        request.wallet(),
        request.communicationPreferences(),
        null, // loyalty - not set on creation
        b2bInfo,
        now,
        now);
  }

  private Customer buildSubAccount(Customer parent, CreateCustomerRequest request) {
    String customerId = UUID.randomUUID().toString();
    Instant now = Instant.now();

    B2BInfo b2bInfo =
        new B2BInfo(
            parent.customerId(),
            request.companyInfo(),
            List.of(),
            AccountTier.STANDARD,
            parent.b2bInfo() != null ? parent.b2bInfo().salesRepId() : null);

    return new Customer(
        customerId,
        request.storeNumber(),
        request.name(),
        request.email(),
        request.phone(),
        CustomerType.BUSINESS,
        CustomerStatus.ACTIVE,
        request.addresses() != null ? request.addresses() : List.of(),
        request.wallet(),
        request.communicationPreferences(),
        null,
        b2bInfo,
        now,
        now);
  }

  private Customer applyUpdates(Customer existing, UpdateCustomerRequest request) {
    return existing.withUpdates(
        request.name(),
        request.email(),
        request.phone(),
        request.status(),
        request.addresses(),
        request.wallet(),
        request.communicationPreferences(),
        request.loyalty(),
        request.b2bInfo());
  }
}
