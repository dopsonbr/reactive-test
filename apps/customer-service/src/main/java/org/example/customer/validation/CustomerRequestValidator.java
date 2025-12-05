package org.example.customer.validation;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.example.customer.controller.dto.CreateCustomerRequest;
import org.example.customer.controller.dto.CustomerSearchRequest;
import org.example.customer.controller.dto.UpdateCustomerRequest;
import org.example.model.customer.CustomerType;
import org.example.platform.error.ValidationException;
import org.example.platform.error.ValidationException.ValidationError;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/** Validator for customer request DTOs. */
@Component
public class CustomerRequestValidator {

  private static final int STORE_NUMBER_MIN = 1;
  private static final int STORE_NUMBER_MAX = 2000;
  private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
  private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[1-9]\\d{1,14}$");
  private static final Pattern UUID_PATTERN =
      Pattern.compile(
          "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
  private static final Pattern USER_ID_PATTERN = Pattern.compile("^[a-zA-Z0-9]{6}$");

  public Mono<Void> validateCreateRequest(
      CreateCustomerRequest request,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    if (request.name() == null || request.name().isBlank()) {
      errors.add(new ValidationError("name", "Name is required"));
    }
    if (request.email() == null || !EMAIL_PATTERN.matcher(request.email()).matches()) {
      errors.add(new ValidationError("email", "Valid email is required"));
    }
    if (request.phone() != null
        && !request.phone().isBlank()
        && !PHONE_PATTERN.matcher(request.phone()).matches()) {
      errors.add(new ValidationError("phone", "Invalid phone format"));
    }
    if (request.type() == null) {
      errors.add(new ValidationError("type", "Customer type is required"));
    }
    if (request.type() == CustomerType.BUSINESS && request.companyInfo() == null) {
      errors.add(new ValidationError("companyInfo", "Company info required for B2B customers"));
    }
    if (request.storeNumber() < STORE_NUMBER_MIN || request.storeNumber() > STORE_NUMBER_MAX) {
      errors.add(
          new ValidationError(
              "storeNumber",
              String.format("Must be between %d and %d", STORE_NUMBER_MIN, STORE_NUMBER_MAX)));
    }

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  public Mono<Void> validateUpdateRequest(
      UpdateCustomerRequest request,
      String customerId,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    if (customerId == null || customerId.isBlank()) {
      errors.add(new ValidationError("customerId", "Customer ID is required"));
    }
    if (request.email() != null
        && !request.email().isBlank()
        && !EMAIL_PATTERN.matcher(request.email()).matches()) {
      errors.add(new ValidationError("email", "Invalid email format"));
    }
    if (request.phone() != null
        && !request.phone().isBlank()
        && !PHONE_PATTERN.matcher(request.phone()).matches()) {
      errors.add(new ValidationError("phone", "Invalid phone format"));
    }

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  public Mono<Void> validateSearchRequest(
      CustomerSearchRequest request,
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    if (!request.hasSearchCriteria()) {
      errors.add(
          new ValidationError(
              "search",
              "At least one search criterion required (customerId, email, or" + " phone)"));
    }

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  public Mono<Void> validateGetRequest(
      String customerId, int storeNumber, String orderNumber, String userId, String sessionId) {
    List<ValidationError> errors = new ArrayList<>();

    validateCommonHeaders(storeNumber, orderNumber, userId, sessionId, errors);

    if (customerId == null || customerId.isBlank()) {
      errors.add(new ValidationError("customerId", "Customer ID is required"));
    }

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  private void validateCommonHeaders(
      int storeNumber,
      String orderNumber,
      String userId,
      String sessionId,
      List<ValidationError> errors) {
    if (storeNumber < STORE_NUMBER_MIN || storeNumber > STORE_NUMBER_MAX) {
      errors.add(
          new ValidationError(
              "x-store-number",
              String.format("Must be between %d and %d", STORE_NUMBER_MIN, STORE_NUMBER_MAX)));
    }
    if (orderNumber == null || !UUID_PATTERN.matcher(orderNumber).matches()) {
      errors.add(new ValidationError("x-order-number", "Must be a valid UUID"));
    }
    if (userId == null || !USER_ID_PATTERN.matcher(userId).matches()) {
      errors.add(new ValidationError("x-userid", "Must be 6 alphanumeric characters"));
    }
    if (sessionId == null || !UUID_PATTERN.matcher(sessionId).matches()) {
      errors.add(new ValidationError("x-sessionid", "Must be a valid UUID"));
    }
  }
}
