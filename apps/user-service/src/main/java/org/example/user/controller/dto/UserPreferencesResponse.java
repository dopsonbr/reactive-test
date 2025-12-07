package org.example.user.controller.dto;

import java.util.UUID;
import org.example.user.model.UserPreferences;

/** Response DTO for user preferences. */
public record UserPreferencesResponse(
    UUID userId,
    String locale,
    String timezone,
    String currency,
    boolean marketingEmail,
    boolean marketingSms,
    boolean orderUpdatesEmail,
    boolean orderUpdatesSms,
    String displayTheme,
    int itemsPerPage) {

  public static UserPreferencesResponse from(UserPreferences prefs) {
    return new UserPreferencesResponse(
        prefs.userId(),
        prefs.locale(),
        prefs.timezone(),
        prefs.currency(),
        prefs.marketingEmail(),
        prefs.marketingSms(),
        prefs.orderUpdatesEmail(),
        prefs.orderUpdatesSms(),
        prefs.displayTheme(),
        prefs.itemsPerPage());
  }
}
