package org.example.discount.exception;

/** Exception thrown when a discount code is invalid or not found. */
public class InvalidDiscountException extends RuntimeException {

  private final String code;

  public InvalidDiscountException(String code) {
    super("Invalid or expired discount code: " + code);
    this.code = code;
  }

  public String getCode() {
    return code;
  }
}
