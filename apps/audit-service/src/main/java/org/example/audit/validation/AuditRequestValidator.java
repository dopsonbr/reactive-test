package org.example.audit.validation;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.example.platform.audit.AuditEvent;
import org.example.platform.error.ValidationException;
import org.example.platform.error.ValidationException.ValidationError;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Validator for audit service requests.
 *
 * <p>Collects ALL validation errors before returning, allowing clients to fix all issues in a
 * single iteration.
 */
@Component
public class AuditRequestValidator {

  private static final int STORE_NUMBER_MIN = 1;
  private static final int STORE_NUMBER_MAX = 2000;
  private static final int LIMIT_MIN = 1;
  private static final int LIMIT_MAX = 1000;

  private static final Pattern UUID_PATTERN =
      Pattern.compile(
          "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

  /** Validate event ID. */
  public Mono<Void> validateEventId(String eventId) {
    List<ValidationError> errors = new ArrayList<>();

    if (eventId == null || eventId.isBlank()) {
      errors.add(new ValidationError("eventId", "Event ID is required"));
    } else if (!isValidUuid(eventId)) {
      errors.add(new ValidationError("eventId", "Event ID must be a valid UUID"));
    }

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate entity query parameters. */
  public Mono<Void> validateEntityQuery(String entityType, String entityId, int limit) {
    List<ValidationError> errors = new ArrayList<>();

    if (entityType == null || entityType.isBlank()) {
      errors.add(new ValidationError("entityType", "Entity type is required"));
    }

    if (entityId == null || entityId.isBlank()) {
      errors.add(new ValidationError("entityId", "Entity ID is required"));
    }

    validateLimit(limit, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate user query parameters. */
  public Mono<Void> validateUserQuery(String userId, int limit) {
    List<ValidationError> errors = new ArrayList<>();

    if (userId == null || userId.isBlank()) {
      errors.add(new ValidationError("userId", "User ID is required"));
    }

    validateLimit(limit, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate store query parameters. */
  public Mono<Void> validateStoreQuery(int storeNumber, String entityType, int limit) {
    List<ValidationError> errors = new ArrayList<>();

    if (storeNumber < STORE_NUMBER_MIN || storeNumber > STORE_NUMBER_MAX) {
      errors.add(
          new ValidationError(
              "storeNumber",
              "Store number must be between " + STORE_NUMBER_MIN + " and " + STORE_NUMBER_MAX));
    }

    if (entityType == null || entityType.isBlank()) {
      errors.add(new ValidationError("entityType", "Entity type is required"));
    }

    validateLimit(limit, errors);

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  /** Validate audit event for creation. */
  public Mono<Void> validateAuditEvent(AuditEvent event) {
    List<ValidationError> errors = new ArrayList<>();

    if (event == null) {
      errors.add(new ValidationError("body", "Request body is required"));
      return Mono.error(new ValidationException(errors));
    }

    if (event.eventType() == null || event.eventType().isBlank()) {
      errors.add(new ValidationError("eventType", "Event type is required"));
    }

    if (event.entityType() == null || event.entityType().isBlank()) {
      errors.add(new ValidationError("entityType", "Entity type is required"));
    }

    if (event.entityId() == null || event.entityId().isBlank()) {
      errors.add(new ValidationError("entityId", "Entity ID is required"));
    }

    return errors.isEmpty() ? Mono.empty() : Mono.error(new ValidationException(errors));
  }

  // ==================== Common Validation Helpers ====================

  private void validateLimit(int limit, List<ValidationError> errors) {
    if (limit < LIMIT_MIN || limit > LIMIT_MAX) {
      errors.add(
          new ValidationError("limit", "Limit must be between " + LIMIT_MIN + " and " + LIMIT_MAX));
    }
  }

  private boolean isValidUuid(String value) {
    return value != null && UUID_PATTERN.matcher(value).matches();
  }
}
