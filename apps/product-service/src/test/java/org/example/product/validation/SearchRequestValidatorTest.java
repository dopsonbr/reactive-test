package org.example.product.validation;

import java.math.BigDecimal;
import java.util.Optional;
import org.example.platform.error.ValidationException;
import org.example.product.domain.SearchCriteria;
import org.example.product.domain.SortDirection;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

class SearchRequestValidatorTest {

  private SearchRequestValidator validator;

  @BeforeEach
  void setUp() {
    validator = new SearchRequestValidator();
  }

  @Test
  void shouldAcceptValidSearchCriteria() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.of(new BigDecimal("100")),
            Optional.of(new BigDecimal("500")),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.of("12345"),
            Optional.of("100"),
            "price",
            SortDirection.ASC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria)).verifyComplete();
  }

  @Test
  void shouldAcceptEmptyQuery() {
    // Empty query is allowed for browsing all products
    SearchCriteria criteria =
        new SearchCriteria(
            "",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria)).verifyComplete();
  }

  @Test
  void shouldAcceptNullQuery() {
    // Null query is allowed for browsing all products
    SearchCriteria criteria =
        new SearchCriteria(
            null,
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria)).verifyComplete();
  }

  @Test
  void shouldAcceptEmptyQueryWithCategory() {
    // Category-only browsing with empty query
    SearchCriteria criteria =
        new SearchCriteria(
            "",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.of("Electronics"),
            Optional.empty(),
            Optional.empty(),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria)).verifyComplete();
  }

  @Test
  void shouldRejectQueryTooShort() {
    SearchCriteria criteria =
        new SearchCriteria(
            "a",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria))
        .expectError(ValidationException.class)
        .verify();
  }

  @Test
  void shouldRejectMinPriceGreaterThanMaxPrice() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.of(new BigDecimal("500")),
            Optional.of(new BigDecimal("100")),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "price",
            SortDirection.ASC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria))
        .expectError(ValidationException.class)
        .verify();
  }

  @Test
  void shouldRejectNegativeMinPrice() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.of(new BigDecimal("-10")),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "price",
            SortDirection.ASC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria))
        .expectError(ValidationException.class)
        .verify();
  }

  @Test
  void shouldRejectNegativeMaxPrice() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.of(new BigDecimal("-10")),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "price",
            SortDirection.ASC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria))
        .expectError(ValidationException.class)
        .verify();
  }

  @Test
  void shouldRejectNegativeMinAvailability() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.empty(),
            Optional.of(-5),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria))
        .expectError(ValidationException.class)
        .verify();
  }

  @Test
  void shouldRejectInvalidSortField() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            "invalid_field",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria))
        .expectError(ValidationException.class)
        .verify();
  }

  @Test
  void shouldRejectInvalidZipCode() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.of("invalid"),
            Optional.empty(),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria))
        .expectError(ValidationException.class)
        .verify();
  }

  @Test
  void shouldAcceptValid5DigitZipCode() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.of("12345"),
            Optional.empty(),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria)).verifyComplete();
  }

  @Test
  void shouldAcceptValid5Plus4ZipCode() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.of("12345-6789"),
            Optional.empty(),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria)).verifyComplete();
  }

  @Test
  void shouldRejectInvalidSellingLocation() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.of("INVALID_LOCATION"),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria))
        .expectError(ValidationException.class)
        .verify();
  }

  @Test
  void shouldAcceptNumericStoreId() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.of("1234"),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria)).verifyComplete();
  }

  @Test
  void shouldAcceptOnlineSellingLocation() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.of("ONLINE"),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria)).verifyComplete();
  }

  @Test
  void shouldAcceptMobileAppSellingLocation() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.of("MOBILE_APP"),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria)).verifyComplete();
  }

  @Test
  void shouldAcceptKioskSellingLocation() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.of("KIOSK"),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria)).verifyComplete();
  }

  @Test
  void shouldAcceptCallCenterSellingLocation() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.of("CALL_CENTER"),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria)).verifyComplete();
  }

  @Test
  void shouldRejectStoreIdOutOfRange() {
    SearchCriteria criteria =
        new SearchCriteria(
            "laptop",
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.empty(),
            Optional.of("10000"),
            "relevance",
            SortDirection.DESC,
            0,
            20);

    StepVerifier.create(validator.validate(criteria))
        .expectError(ValidationException.class)
        .verify();
  }

  @Test
  void shouldAcceptAllValidSortFields() {
    String[] validSortFields = {"relevance", "price", "availability", "description"};

    for (String sortField : validSortFields) {
      SearchCriteria criteria =
          new SearchCriteria(
              "laptop",
              Optional.empty(),
              Optional.empty(),
              Optional.empty(),
              Optional.empty(),
              Optional.empty(),
              Optional.empty(),
              Optional.empty(),
              sortField,
              SortDirection.DESC,
              0,
              20);

      StepVerifier.create(validator.validate(criteria)).verifyComplete();
    }
  }
}
