package org.example.user.controller.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/** Request for updating user preferences. */
public record UpdatePreferencesRequest(
    @Size(max = 10, message = "Locale must be at most 10 characters") String locale,
    @Size(max = 50, message = "Timezone must be at most 50 characters") String timezone,
    @Size(min = 3, max = 3, message = "Currency must be exactly 3 characters") String currency,
    Boolean marketingEmail,
    Boolean marketingSms,
    Boolean orderUpdatesEmail,
    Boolean orderUpdatesSms,
    @Size(max = 20, message = "Display theme must be at most 20 characters") String displayTheme,
    @Min(value = 5, message = "Items per page must be at least 5")
        @Max(value = 100, message = "Items per page must be at most 100")
        Integer itemsPerPage) {}
