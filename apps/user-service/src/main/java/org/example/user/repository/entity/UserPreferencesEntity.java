package org.example.user.repository.entity;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/** Database entity for user_preferences table. */
@Table("user_preferences")
public record UserPreferencesEntity(
    @Id @Column("user_id") UUID userId,
    String locale,
    String timezone,
    String currency,
    @Column("marketing_email") boolean marketingEmail,
    @Column("marketing_sms") boolean marketingSms,
    @Column("order_updates_email") boolean orderUpdatesEmail,
    @Column("order_updates_sms") boolean orderUpdatesSms,
    @Column("display_theme") String displayTheme,
    @Column("items_per_page") int itemsPerPage,
    @Column("created_at") Instant createdAt,
    @Column("updated_at") Instant updatedAt) {}
