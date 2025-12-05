package org.example.customer.repository;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/** Database entity for customers table. */
@Table("customers")
public record CustomerEntity(
        @Id UUID id,
        @Column("store_number") int storeNumber,
        @Column("customer_id") String customerId,
        @Column("name") String name,
        @Column("email") String email,
        @Column("phone") String phone,
        @Column("customer_type") String customerType,
        @Column("status") String status,
        @Column("parent_customer_id") String parentCustomerId,
        @Column("addresses_json") String addressesJson,
        @Column("wallet_json") String walletJson,
        @Column("communication_prefs_json") String communicationPrefsJson,
        @Column("loyalty_json") String loyaltyJson,
        @Column("b2b_info_json") String b2bInfoJson,
        @Column("created_at") Instant createdAt,
        @Column("updated_at") Instant updatedAt) {}
