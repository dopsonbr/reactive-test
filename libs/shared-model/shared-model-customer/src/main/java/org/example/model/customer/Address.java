package org.example.model.customer;

/**
 * Customer address.
 *
 * @param addressId unique identifier for the address
 * @param type the type of address
 * @param line1 street address line 1
 * @param line2 street address line 2 (optional)
 * @param city city name
 * @param state state or province
 * @param postalCode postal or zip code
 * @param country country code (ISO 3166-1 alpha-2)
 * @param isPrimary whether this is the primary address for its type
 */
public record Address(
        String addressId,
        AddressType type,
        String line1,
        String line2,
        String city,
        String state,
        String postalCode,
        String country,
        boolean isPrimary) {}
