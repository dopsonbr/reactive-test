package org.example.platform.logging;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import reactor.core.publisher.Mono;

/**
 * WebClient filter that logs outbound HTTP requests and responses with Reactor Context correlation.
 */
@Component
public class WebClientLoggingFilter {
  private final StructuredLogger structuredLogger;

  public WebClientLoggingFilter(StructuredLogger structuredLogger) {
    this.structuredLogger = structuredLogger;
  }

  /**
   * Creates an ExchangeFilterFunction that logs requests and responses.
   *
   * @param repositoryName the name to use as the logger name
   * @return an ExchangeFilterFunction for WebClient
   */
  public ExchangeFilterFunction create(String repositoryName) {
    return (request, next) ->
        Mono.deferContextual(
            ctx -> {
              logRequest(ctx, repositoryName, request);
              return next.exchange(request)
                  .doOnNext(response -> logResponse(ctx, repositoryName, request, response));
            });
  }

  private void logRequest(
      reactor.util.context.ContextView ctx, String repositoryName, ClientRequest request) {
    String path = request.url().getPath();
    String host = request.url().getHost() + ":" + request.url().getPort();
    String uri = request.url().getPath();
    String method = request.method().name();

    RequestLogData data = new RequestLogData(path, host, uri, method, extractBody(request));
    structuredLogger.logRequest(ctx, repositoryName, data);
  }

  private void logResponse(
      reactor.util.context.ContextView ctx,
      String repositoryName,
      ClientRequest request,
      ClientResponse response) {
    String path = request.url().getPath();
    String host = request.url().getHost() + ":" + request.url().getPort();
    String uri = request.url().getPath();
    String method = request.method().name();
    int status = response.statusCode().value();

    ResponseLogData data = new ResponseLogData(path, host, uri, method, status, null);
    structuredLogger.logResponse(ctx, repositoryName, data);
  }

  private Object extractBody(ClientRequest request) {
    // Body extraction from ClientRequest is complex; return null for now
    return null;
  }
}
