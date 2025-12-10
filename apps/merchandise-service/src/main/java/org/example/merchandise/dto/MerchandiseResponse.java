package org.example.merchandise.dto;

public record MerchandiseResponse(
    String name, String description, String imageUrl, String category) {}
