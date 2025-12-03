package org.example.platform.logging;

import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

class WebClientLoggingFilterTest {

    private StructuredLogger structuredLogger;
    private WebClientLoggingFilter filter;
    private ExchangeFunction exchangeFunction;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        structuredLogger = new StructuredLogger(objectMapper);
        filter = new WebClientLoggingFilter(structuredLogger);
        exchangeFunction = mock(ExchangeFunction.class);
    }

    @Test
    void shouldLogRequestAndResponseWithMetadata() {
        // Given
        RequestMetadata metadata = new RequestMetadata(1234, "order-123", "user01", "session-456");

        ClientRequest request =
                ClientRequest.create(HttpMethod.GET, URI.create("http://localhost:8081/test"))
                        .build();

        ClientResponse response = ClientResponse.create(HttpStatus.OK).build();

        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(response));

        // When
        var filterFunction = filter.create("testrepository");

        Mono<ClientResponse> result =
                filterFunction
                        .filter(request, exchangeFunction)
                        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));

        // Then
        StepVerifier.create(result).expectNextCount(1).verifyComplete();

        verify(exchangeFunction).exchange(any());
    }

    @Test
    void shouldHandleNullPayloadInRequest() {
        // Given
        RequestMetadata metadata = new RequestMetadata(1234, "order-123", "user01", "session-456");

        ClientRequest request =
                ClientRequest.create(HttpMethod.POST, URI.create("http://localhost:8081/price"))
                        .build();

        ClientResponse response = ClientResponse.create(HttpStatus.OK).build();

        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(response));

        // When
        var filterFunction = filter.create("pricerepository");

        Mono<ClientResponse> result =
                filterFunction
                        .filter(request, exchangeFunction)
                        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));

        // Then - should not throw serialization error
        StepVerifier.create(result).expectNextCount(1).verifyComplete();
    }

    @Test
    void shouldSerializeLogEntryWithoutError() throws Exception {
        // Given
        ObjectMapper objectMapper = new ObjectMapper();
        RequestMetadata metadata = new RequestMetadata(1234, "order-123", "user01", "session-456");

        // Test that the log data models can be serialized
        var requestData = new RequestLogData("/test", "localhost:8081", "/test", "GET", null);
        var logEntry =
                new LogEntry("info", "testlogger", "trace-123", "span-456", metadata, requestData);

        // When/Then - should not throw
        String json = objectMapper.writeValueAsString(logEntry);
        System.out.println("Serialized: " + json);

        assert json.contains("order-123");
        assert json.contains("testlogger");
    }
}
