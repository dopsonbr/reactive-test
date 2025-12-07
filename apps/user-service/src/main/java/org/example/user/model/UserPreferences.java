package org.example.user.model;

import java.util.UUID;

/** User preferences for display and communication settings. */
public record UserPreferences(
    UUID userId,
    String locale,
    String timezone,
    String currency,
    boolean marketingEmail,
    boolean marketingSms,
    boolean orderUpdatesEmail,
    boolean orderUpdatesSms,
    String displayTheme,
    int itemsPerPage) {}
