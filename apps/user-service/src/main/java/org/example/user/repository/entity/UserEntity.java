package org.example.user.repository.entity;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/** Database entity for users table. */
@Table("users")
public record UserEntity(
    @Id UUID id,
    String username,
    @Column("password_hash") String passwordHash,
    @Column("user_type") String userType,
    String[] permissions,
    @Column("store_number") Integer storeNumber,
    String email,
    @Column("display_name") String displayName,
    boolean active,
    @Column("created_at") Instant createdAt,
    @Column("updated_at") Instant updatedAt,
    @Column("last_login_at") Instant lastLoginAt) {}
