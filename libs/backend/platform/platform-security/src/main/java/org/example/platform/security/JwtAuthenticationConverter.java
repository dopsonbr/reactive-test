package org.example.platform.security;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Converts JWT claims to Spring Security authorities. Supports multiple scope claim formats used by
 * different OAuth providers: - "scope" (space-delimited string) - OAuth 2.0 standard - "scp"
 * (space-delimited string) - Azure AD - "scopes" (array) - Some custom implementations
 */
@Component
public class JwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

  private static final String SCOPE_CLAIM = "scope";
  private static final String SCP_CLAIM = "scp";
  private static final String SCOPES_CLAIM = "scopes";

  @Override
  public AbstractAuthenticationToken convert(Jwt jwt) {
    Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
    return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
  }

  private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
    return Stream.of(
            extractScopeAuthorities(jwt, SCOPE_CLAIM),
            extractScopeAuthorities(jwt, SCP_CLAIM),
            extractScopesArrayAuthorities(jwt))
        .flatMap(Collection::stream)
        .collect(Collectors.toSet());
  }

  private Collection<GrantedAuthority> extractScopeAuthorities(Jwt jwt, String claimName) {
    String scopeString = jwt.getClaimAsString(claimName);
    if (scopeString == null || scopeString.isBlank()) {
      return Collections.emptyList();
    }
    return Stream.of(scopeString.split("\\s+"))
        .map(scope -> new SimpleGrantedAuthority("SCOPE_" + scope))
        .collect(Collectors.toList());
  }

  private Collection<GrantedAuthority> extractScopesArrayAuthorities(Jwt jwt) {
    List<String> scopes = jwt.getClaimAsStringList(SCOPES_CLAIM);
    if (scopes == null) {
      return Collections.emptyList();
    }
    return scopes.stream()
        .map(scope -> new SimpleGrantedAuthority("SCOPE_" + scope))
        .collect(Collectors.toList());
  }
}
