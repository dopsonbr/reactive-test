package org.example.cart.graphql.input;

public record CreateCartInput(int storeNumber, String customerId // nullable
        ) {}
