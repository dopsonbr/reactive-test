package org.example.reactivetest.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient merchandiseWebClient(
        @Value("${services.merchandise.base-url}") String baseUrl,
        WebClientLoggingFilter loggingFilter
    ) {
        return WebClient.builder()
            .baseUrl(baseUrl)
            .filter(loggingFilter.create("merchandiserepository"))
            .build();
    }

    @Bean
    public WebClient priceWebClient(
        @Value("${services.price.base-url}") String baseUrl,
        WebClientLoggingFilter loggingFilter
    ) {
        return WebClient.builder()
            .baseUrl(baseUrl)
            .filter(loggingFilter.create("pricerepository"))
            .build();
    }

    @Bean
    public WebClient inventoryWebClient(
        @Value("${services.inventory.base-url}") String baseUrl,
        WebClientLoggingFilter loggingFilter
    ) {
        return WebClient.builder()
            .baseUrl(baseUrl)
            .filter(loggingFilter.create("inventoryrepository"))
            .build();
    }
}
