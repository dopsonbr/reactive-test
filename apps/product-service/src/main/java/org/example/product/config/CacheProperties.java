package org.example.product.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cache")
public class CacheProperties {

  private ServiceCache merchandise = new ServiceCache(Duration.ofMinutes(15));
  private ServiceCache price = new ServiceCache(Duration.ofMinutes(2));
  private ServiceCache inventory = new ServiceCache(Duration.ofSeconds(30));

  public ServiceCache getMerchandise() {
    return merchandise;
  }

  public void setMerchandise(ServiceCache merchandise) {
    this.merchandise = merchandise;
  }

  public ServiceCache getPrice() {
    return price;
  }

  public void setPrice(ServiceCache price) {
    this.price = price;
  }

  public ServiceCache getInventory() {
    return inventory;
  }

  public void setInventory(ServiceCache inventory) {
    this.inventory = inventory;
  }

  public static class ServiceCache {
    private Duration ttl;

    public ServiceCache() {
      this.ttl = Duration.ofMinutes(5);
    }

    public ServiceCache(Duration ttl) {
      this.ttl = ttl;
    }

    public Duration getTtl() {
      return ttl;
    }

    public void setTtl(Duration ttl) {
      this.ttl = ttl;
    }
  }
}
