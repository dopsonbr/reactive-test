package org.example.price.dto;

import java.math.BigDecimal;

public record PriceResponse(BigDecimal price, BigDecimal originalPrice, String currency) {}
