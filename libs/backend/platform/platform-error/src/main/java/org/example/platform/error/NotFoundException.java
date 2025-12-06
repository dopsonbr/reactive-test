package org.example.platform.error;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Exception thrown when a requested resource is not found. */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class NotFoundException extends RuntimeException {

  public NotFoundException(String message) {
    super(message);
  }

  public NotFoundException(String resourceType, String resourceId) {
    super(String.format("%s not found: %s", resourceType, resourceId));
  }

  public NotFoundException(String message, Throwable cause) {
    super(message, cause);
  }
}
