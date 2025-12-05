package org.example.product.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cache.search")
public class SearchCacheProperties {

  private Duration searchTtl = Duration.ofMinutes(5);
  private Duration suggestionsTtl = Duration.ofHours(1);

  public Duration getSearchTtl() {
    return searchTtl;
  }

  public void setSearchTtl(Duration searchTtl) {
    this.searchTtl = searchTtl;
  }

  public Duration getSuggestionsTtl() {
    return suggestionsTtl;
  }

  public void setSuggestionsTtl(Duration suggestionsTtl) {
    this.suggestionsTtl = suggestionsTtl;
  }
}
