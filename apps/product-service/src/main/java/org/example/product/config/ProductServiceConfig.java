package org.example.product.config;

import org.example.platform.logging.WebClientLoggingFilter;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Configures WebClient beans for downstream service calls.
 * Each WebClient includes:
 * - OAuth2 filter for automatic client credentials token injection (when enabled)
 * - Logging filter for structured request/response logging
 */
@Configuration
public class ProductServiceConfig {

    /**
     * No-op filter used when OAuth2 client is disabled (e.g., in tests).
     */
    private static final ExchangeFilterFunction NO_OP_FILTER =
        (request, next) -> next.exchange(request);

    @Bean
    public WebClient merchandiseWebClient(
        @Value("${services.merchandise.base-url}") String baseUrl,
        WebClientLoggingFilter loggingFilter,
        @Qualifier("oauth2Filter") ObjectProvider<ExchangeFilterFunction> oauth2FilterProvider
    ) {
        ExchangeFilterFunction oauth2Filter = oauth2FilterProvider.getIfAvailable(() -> NO_OP_FILTER);
        return WebClient.builder()
            .baseUrl(baseUrl)
            .filter(oauth2Filter)
            .filter(loggingFilter.create("merchandiserepository"))
            .build();
    }

    @Bean
    public WebClient priceWebClient(
        @Value("${services.price.base-url}") String baseUrl,
        WebClientLoggingFilter loggingFilter,
        @Qualifier("oauth2Filter") ObjectProvider<ExchangeFilterFunction> oauth2FilterProvider
    ) {
        ExchangeFilterFunction oauth2Filter = oauth2FilterProvider.getIfAvailable(() -> NO_OP_FILTER);
        return WebClient.builder()
            .baseUrl(baseUrl)
            .filter(oauth2Filter)
            .filter(loggingFilter.create("pricerepository"))
            .build();
    }

    @Bean
    public WebClient inventoryWebClient(
        @Value("${services.inventory.base-url}") String baseUrl,
        WebClientLoggingFilter loggingFilter,
        @Qualifier("oauth2Filter") ObjectProvider<ExchangeFilterFunction> oauth2FilterProvider
    ) {
        ExchangeFilterFunction oauth2Filter = oauth2FilterProvider.getIfAvailable(() -> NO_OP_FILTER);
        return WebClient.builder()
            .baseUrl(baseUrl)
            .filter(oauth2Filter)
            .filter(loggingFilter.create("inventoryrepository"))
            .build();
    }
}
