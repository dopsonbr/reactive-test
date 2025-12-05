package org.example.product.validation;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import org.example.platform.error.ValidationException;
import org.example.platform.error.ValidationException.ValidationError;
import org.example.product.domain.SearchCriteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class SearchRequestValidator {

    private static final int MIN_QUERY_LENGTH = 2;
    private static final int MAX_QUERY_LENGTH = 200;
    private static final BigDecimal MAX_PRICE = new BigDecimal("999999.99");
    private static final Pattern ZIP_CODE_PATTERN = Pattern.compile("^\\d{5}(-\\d{4})?$");
    private static final Set<String> VIRTUAL_STORE_TYPES =
            Set.of("ONLINE", "MOBILE_APP", "KIOSK", "CALL_CENTER");
    private static final Set<String> VALID_SORT_FIELDS =
            Set.of("relevance", "price", "availability", "description");

    public Mono<Void> validate(SearchCriteria criteria) {
        List<ValidationError> errors = new ArrayList<>();

        // Query validation
        if (criteria.query() == null || criteria.query().isBlank()) {
            errors.add(new ValidationError("q", "Search query is required"));
        } else if (criteria.query().length() < MIN_QUERY_LENGTH) {
            errors.add(
                    new ValidationError(
                            "q",
                            "Search query must be at least " + MIN_QUERY_LENGTH + " characters"));
        } else if (criteria.query().length() > MAX_QUERY_LENGTH) {
            errors.add(
                    new ValidationError(
                            "q",
                            "Search query must not exceed " + MAX_QUERY_LENGTH + " characters"));
        }

        // Price validation
        criteria.minPrice()
                .ifPresent(
                        min -> {
                            if (min.compareTo(BigDecimal.ZERO) < 0) {
                                errors.add(
                                        new ValidationError(
                                                "minPrice", "Minimum price cannot be negative"));
                            }
                            if (min.compareTo(MAX_PRICE) > 0) {
                                errors.add(
                                        new ValidationError(
                                                "minPrice",
                                                "Minimum price exceeds maximum allowed value"));
                            }
                        });
        criteria.maxPrice()
                .ifPresent(
                        max -> {
                            if (max.compareTo(BigDecimal.ZERO) < 0) {
                                errors.add(
                                        new ValidationError(
                                                "maxPrice", "Maximum price cannot be negative"));
                            }
                            if (max.compareTo(MAX_PRICE) > 0) {
                                errors.add(
                                        new ValidationError(
                                                "maxPrice",
                                                "Maximum price exceeds maximum allowed value"));
                            }
                        });
        if (criteria.minPrice().isPresent() && criteria.maxPrice().isPresent()) {
            if (criteria.minPrice().get().compareTo(criteria.maxPrice().get()) > 0) {
                errors.add(
                        new ValidationError(
                                "minPrice", "Minimum price cannot be greater than maximum price"));
            }
        }

        // Availability validation
        criteria.minAvailability()
                .ifPresent(
                        min -> {
                            if (min < 0) {
                                errors.add(
                                        new ValidationError(
                                                "minAvailability",
                                                "Minimum availability cannot be negative"));
                            }
                        });

        // Zip code validation
        criteria.customerZipCode()
                .ifPresent(
                        zip -> {
                            if (!ZIP_CODE_PATTERN.matcher(zip).matches()) {
                                errors.add(
                                        new ValidationError(
                                                "customerZipCode",
                                                "Invalid zip code format. Expected 5 digits or 5+4"
                                                        + " format"));
                            }
                        });

        // Selling location validation
        criteria.sellingLocation()
                .ifPresent(
                        location -> {
                            if (!isValidSellingLocation(location)) {
                                errors.add(
                                        new ValidationError(
                                                "sellingLocation",
                                                "Invalid selling location: "
                                                        + location
                                                        + ". Must be numeric store ID (1-9999) or: "
                                                        + VIRTUAL_STORE_TYPES));
                            }
                        });

        // Sort field validation
        if (!isValidSortField(criteria.sortBy())) {
            errors.add(
                    new ValidationError(
                            "sortBy",
                            "Invalid sort field. Valid values: relevance, price, availability,"
                                    + " description"));
        }

        if (!errors.isEmpty()) {
            return Mono.error(new ValidationException(errors));
        }
        return Mono.empty();
    }

    private boolean isValidSortField(String sortBy) {
        return sortBy != null && VALID_SORT_FIELDS.contains(sortBy.toLowerCase());
    }

    private boolean isValidSellingLocation(String location) {
        if (location == null || location.isBlank()) {
            return false;
        }
        if (VIRTUAL_STORE_TYPES.contains(location.toUpperCase())) {
            return true;
        }
        try {
            int storeId = Integer.parseInt(location);
            return storeId >= 1 && storeId <= 9999;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
