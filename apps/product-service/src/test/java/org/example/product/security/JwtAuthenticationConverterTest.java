package org.example.product.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.example.platform.security.JwtAuthenticationConverter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

class JwtAuthenticationConverterTest {

    private JwtAuthenticationConverter converter;

    @BeforeEach
    void setUp() {
        converter = new JwtAuthenticationConverter();
    }

    @Test
    void shouldExtractScopesFromSpaceDelimitedClaim() {
        Jwt jwt = createJwt(Map.of("scope", "product:read product:write"));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(extractAuthorities(token))
                .containsExactlyInAnyOrder("SCOPE_product:read", "SCOPE_product:write");
    }

    @Test
    void shouldExtractScopesFromScpClaim() {
        Jwt jwt = createJwt(Map.of("scp", "product:read"));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(extractAuthorities(token)).contains("SCOPE_product:read");
    }

    @Test
    void shouldExtractScopesFromScopesArrayClaim() {
        Jwt jwt = createJwt(Map.of("scopes", List.of("product:read", "inventory:read")));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(extractAuthorities(token))
                .containsExactlyInAnyOrder("SCOPE_product:read", "SCOPE_inventory:read");
    }

    @Test
    void shouldReturnEmptyAuthoritiesWhenNoScopes() {
        Jwt jwt = createJwt(Map.of());

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(token.getAuthorities()).isEmpty();
    }

    @Test
    void shouldSetSubjectAsPrincipalName() {
        Jwt jwt = createJwt(Map.of("sub", "user123"));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(token.getName()).isEqualTo("user123");
    }

    @Test
    void shouldHandleMultipleScopeClaimFormats() {
        // Token with both 'scope' and 'scopes' claims
        Jwt jwt = createJwt(Map.of("scope", "product:read", "scopes", List.of("inventory:read")));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(extractAuthorities(token))
                .containsExactlyInAnyOrder("SCOPE_product:read", "SCOPE_inventory:read");
    }

    @Test
    void shouldHandleEmptyScopeClaim() {
        Jwt jwt = createJwt(Map.of("scope", ""));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(token.getAuthorities()).isEmpty();
    }

    @Test
    void shouldHandleBlankScopeClaim() {
        Jwt jwt = createJwt(Map.of("scope", "   "));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(token.getAuthorities()).isEmpty();
    }

    private Jwt createJwt(Map<String, Object> claims) {
        return Jwt.withTokenValue("test-token")
                .header("alg", "RS256")
                .claim("sub", claims.getOrDefault("sub", "test-user"))
                .claims(c -> c.putAll(claims))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
    }

    private List<String> extractAuthorities(JwtAuthenticationToken token) {
        return token.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
    }
}
