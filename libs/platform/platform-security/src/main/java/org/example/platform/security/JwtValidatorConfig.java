package org.example.platform.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

import java.time.Duration;
import java.util.List;

/**
 * Configures JWT validation with custom validators for audience, issuer, and expiration.
 * Validates:
 * - Token expiration with configurable clock skew tolerance
 * - Issuer against allowed issuers list
 * - Audience contains required audience
 *
 * This configuration is disabled when app.security.enabled=false (e.g., in tests).
 */
@Configuration
@ConditionalOnProperty(name = "app.security.enabled", havingValue = "true", matchIfMissing = true)
public class JwtValidatorConfig {

    private final SecurityProperties securityProperties;

    public JwtValidatorConfig(SecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        NimbusReactiveJwtDecoder decoder = NimbusReactiveJwtDecoder
            .withJwkSetUri(securityProperties.getJwkSetUri())
            .build();

        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
            // Expiration validation with clock skew tolerance
            new JwtTimestampValidator(Duration.ofSeconds(securityProperties.getClockSkewSeconds())),
            // Issuer validation
            issuerValidator(),
            // Audience validation
            audienceValidator()
        );

        decoder.setJwtValidator(validator);
        return decoder;
    }

    private OAuth2TokenValidator<Jwt> issuerValidator() {
        List<String> allowedIssuers = securityProperties.getAllowedIssuers();
        return token -> {
            String issuer = token.getClaimAsString(JwtClaimNames.ISS);
            if (issuer == null || !allowedIssuers.contains(issuer)) {
                OAuth2Error error = new OAuth2Error(
                    "invalid_token",
                    "The iss claim is not valid. Expected one of: " + allowedIssuers,
                    null
                );
                return OAuth2TokenValidatorResult.failure(error);
            }
            return OAuth2TokenValidatorResult.success();
        };
    }

    private OAuth2TokenValidator<Jwt> audienceValidator() {
        String requiredAudience = securityProperties.getRequiredAudience();
        return new JwtClaimValidator<List<String>>(
            JwtClaimNames.AUD,
            aud -> aud != null && aud.contains(requiredAudience)
        );
    }
}
