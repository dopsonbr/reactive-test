package org.example.model.customer;

/** Type of address. */
public enum AddressType {
    BILLING,
    SHIPPING,
    /** B2B primary location */
    HEADQUARTERS,
    /** B2B subsidiary location */
    BRANCH
}
