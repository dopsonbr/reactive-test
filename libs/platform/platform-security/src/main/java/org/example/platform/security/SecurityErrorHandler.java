package org.example.platform.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import org.example.platform.error.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.security.web.server.authorization.ServerAccessDeniedHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Handles security-related errors and returns structured JSON responses.
 * Implements both authentication (401) and authorization (403) error handling.
 */
@Component
public class SecurityErrorHandler implements ServerAuthenticationEntryPoint, ServerAccessDeniedHandler {

    private static final Logger log = LoggerFactory.getLogger(SecurityErrorHandler.class);

    private final ObjectMapper objectMapper;

    public SecurityErrorHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> commence(ServerWebExchange exchange, AuthenticationException ex) {
        return handleError(exchange, HttpStatus.UNAUTHORIZED, "Authentication required", ex);
    }

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, AccessDeniedException ex) {
        return handleError(exchange, HttpStatus.FORBIDDEN, "Access denied", ex);
    }

    private Mono<Void> handleError(ServerWebExchange exchange, HttpStatus status,
                                    String error, Exception ex) {
        String message = ex.getMessage();
        if (ex instanceof InvalidBearerTokenException) {
            message = "Invalid or expired bearer token";
        }

        String path = exchange.getRequest().getPath().value();

        // Extract trace context
        String traceId = null;
        SpanContext spanContext = Span.current().getSpanContext();
        if (spanContext.isValid()) {
            traceId = spanContext.getTraceId();
        }

        // Log security error
        log.warn("Security error: status={}, error={}, message={}, path={}, traceId={}",
            status.value(), error, message, path, traceId);

        ErrorResponse errorResponse = ErrorResponse.of(
            error,
            message,
            path,
            status.value(),
            traceId
        );

        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        try {
            byte[] bytes = objectMapper.writeValueAsBytes(errorResponse);
            DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
            return exchange.getResponse().writeWith(Mono.just(buffer));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize error response", e);
            return exchange.getResponse().setComplete();
        }
    }
}
