package org.example.platform.test;

/**
 * Utilities for security testing. Provides helper methods to create authorization headers with
 * various token states.
 */
public final class SecurityTestUtils {

    private SecurityTestUtils() {
        // Utility class
    }

    /**
     * Creates a valid JWT bearer token with specified scopes.
     *
     * @param scopes the scopes to include in the token
     * @return a valid JWT token string
     */
    public static String validToken(String... scopes) {
        return TestJwtBuilder.builder().scopes(scopes).build();
    }

    /**
     * Creates an expired JWT bearer token.
     *
     * @return an expired JWT token string
     */
    public static String expiredToken() {
        return TestJwtBuilder.builder().expired().scope("product:read").build();
    }

    /**
     * Creates a token with wrong audience.
     *
     * @return a JWT token with incorrect audience
     */
    public static String wrongAudienceToken() {
        return TestJwtBuilder.builder().audience("wrong-audience").scope("product:read").build();
    }

    /**
     * Creates a token with wrong issuer.
     *
     * @return a JWT token with incorrect issuer
     */
    public static String wrongIssuerToken() {
        return TestJwtBuilder.builder().issuer("wrong-issuer").scope("product:read").build();
    }

    /**
     * Creates a token without any scopes.
     *
     * @return a JWT token without scopes
     */
    public static String noScopesToken() {
        return TestJwtBuilder.builder().scope("").build();
    }

    /**
     * Creates a token with a specific subject.
     *
     * @param subject the subject claim value
     * @param scopes the scopes to include
     * @return a JWT token with the specified subject
     */
    public static String tokenWithSubject(String subject, String... scopes) {
        return TestJwtBuilder.builder().subject(subject).scopes(scopes).build();
    }

    /**
     * Creates the Authorization header value with Bearer prefix.
     *
     * @param token the JWT token
     * @return the Authorization header value
     */
    public static String bearerAuth(String token) {
        return "Bearer " + token;
    }
}
