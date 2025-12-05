package org.example.product.client;

import java.util.List;
import org.example.product.domain.SearchCriteria;
import org.example.product.domain.SearchProduct;
import org.example.product.domain.SearchResponse;
import reactor.core.publisher.Mono;

public interface CatalogServiceClient {
    Mono<SearchResponse<SearchProduct>> search(SearchCriteria criteria);

    Mono<List<String>> getSuggestions(String prefix, int limit);
}
