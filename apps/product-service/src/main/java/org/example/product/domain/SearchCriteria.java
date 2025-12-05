package org.example.product.domain;

import java.math.BigDecimal;
import java.util.Optional;

public record SearchCriteria(
        String query,
        Optional<BigDecimal> minPrice,
        Optional<BigDecimal> maxPrice,
        Optional<Integer> minAvailability,
        Optional<Boolean> inStockOnly,
        Optional<String> category,
        Optional<String> customerZipCode,
        Optional<String> sellingLocation,
        String sortBy,
        SortDirection sortDirection,
        int page,
        int size) {
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
    public static final String DEFAULT_SORT = "relevance";

    public SearchCriteria {
        if (size <= 0) size = DEFAULT_PAGE_SIZE;
        if (size > MAX_PAGE_SIZE) size = MAX_PAGE_SIZE;
        if (page < 0) page = 0;
        if (sortBy == null || sortBy.isBlank()) sortBy = DEFAULT_SORT;
        if (sortDirection == null) sortDirection = SortDirection.DESC;
    }
}
