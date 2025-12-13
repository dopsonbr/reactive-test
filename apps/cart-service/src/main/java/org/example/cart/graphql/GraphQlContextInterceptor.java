package org.example.cart.graphql;

import org.example.platform.webflux.graphql.AbstractGraphQlContextInterceptor;
import org.springframework.stereotype.Component;

/**
 * Intercepts GraphQL requests to populate RequestMetadata into Reactor context.
 *
 * <p>This interceptor uses the centralized metadata extraction logic from platform-webflux to
 * extract required headers (x-store-number, x-order-number, x-userid, x-sessionid) and make them
 * available to all GraphQL resolvers via Reactor Context.
 *
 * <p>Note: Header validation is performed by GraphQLInputValidator to maintain separation of
 * concerns and provide aggregated error responses.
 *
 * <p>HTTP status code mapping for GraphQL errors is handled by {@link GraphQlStatusWebFilter}.
 */
@Component
public class GraphQlContextInterceptor extends AbstractGraphQlContextInterceptor {
  // Metadata extraction inherited from platform-webflux
}
