package org.example.product.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.InMemoryReactiveOAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.ReactiveOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.ReactiveOAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.reactive.function.client.ServerOAuth2AuthorizedClientExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;

/**
 * Configures OAuth2 client credentials for downstream service authentication.
 * Uses in-memory token caching - tokens are cached until expiration, then automatically refreshed.
 *
 * Only active when app.security.oauth2-client.enabled=true (default: true).
 * Disabled in tests via application.yml setting.
 */
@Configuration
@ConditionalOnProperty(name = "app.security.oauth2-client.enabled", havingValue = "true", matchIfMissing = true)
public class OAuth2ClientConfig {

    private static final Logger log = LoggerFactory.getLogger(OAuth2ClientConfig.class);

    /**
     * In-memory cache for authorized clients (tokens).
     * Tokens are cached until they expire, then automatically refreshed on next request.
     */
    @Bean
    public ReactiveOAuth2AuthorizedClientService authorizedClientService(
            ReactiveClientRegistrationRepository clientRegistrationRepository) {
        log.info("Configuring in-memory OAuth2 authorized client service for token caching");
        return new InMemoryReactiveOAuth2AuthorizedClientService(clientRegistrationRepository);
    }

    /**
     * Manages OAuth2 client credentials flow.
     * Uses AuthorizedClientService for token caching.
     */
    @Bean
    public ReactiveOAuth2AuthorizedClientManager authorizedClientManager(
            ReactiveClientRegistrationRepository clientRegistrationRepository,
            ReactiveOAuth2AuthorizedClientService authorizedClientService) {
        return new AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager(
            clientRegistrationRepository,
            authorizedClientService
        );
    }

    /**
     * Exchange filter function that adds OAuth2 bearer token to outbound requests.
     * Automatically handles token acquisition and refresh.
     * Uses "downstream-services" client registration.
     */
    @Bean
    public ExchangeFilterFunction oauth2Filter(
            ReactiveOAuth2AuthorizedClientManager authorizedClientManager) {
        ServerOAuth2AuthorizedClientExchangeFilterFunction filter =
            new ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);

        // Use client_credentials registration for all outbound requests
        filter.setDefaultClientRegistrationId("downstream-services");

        return filter;
    }
}
