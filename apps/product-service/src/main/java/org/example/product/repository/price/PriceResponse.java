package org.example.product.repository.price;

import java.math.BigDecimal;

/** Response from price service. Prices are BigDecimal for precision. */
public record PriceResponse(BigDecimal price, BigDecimal originalPrice, String currency) {}
