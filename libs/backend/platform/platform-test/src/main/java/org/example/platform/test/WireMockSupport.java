package org.example.platform.test;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;

/** Support class for WireMock integration tests. */
public final class WireMockSupport {

  private WireMockSupport() {}

  /**
   * Create a WireMock server on the specified port.
   *
   * @param port the port to listen on
   * @return configured WireMockServer
   */
  public static WireMockServer createServer(int port) {
    return new WireMockServer(WireMockConfiguration.wireMockConfig().port(port));
  }

  /**
   * Create a WireMock server on a random available port.
   *
   * @return configured WireMockServer
   */
  public static WireMockServer createServer() {
    return new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
  }
}
