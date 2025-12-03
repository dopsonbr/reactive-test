package org.example.product.security;

import org.example.platform.test.TestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.client.InMemoryReactiveOAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.ReactiveOAuth2AuthorizedClientService;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("oauth-client-test")
@Import(TestSecurityConfig.class)
class OAuth2ClientCacheTest {

    @Autowired
    private ReactiveOAuth2AuthorizedClientService authorizedClientService;

    @Test
    void shouldUseInMemoryAuthorizedClientService() {
        // Verify in-memory client service is configured for token caching
        assertThat(authorizedClientService)
            .isInstanceOf(InMemoryReactiveOAuth2AuthorizedClientService.class);
    }
}
