package org.example.discount.repository;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.example.model.discount.Markdown;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** In-memory implementation of MarkdownRepository for employee markdowns. */
@Repository
public class InMemoryMarkdownRepository implements MarkdownRepository {

    private final Map<String, Markdown> markdowns = new ConcurrentHashMap<>();

    @Override
    public Mono<Markdown> findById(String markdownId) {
        return Mono.justOrEmpty(markdowns.get(markdownId));
    }

    @Override
    public Flux<Markdown> findActiveByCart(String cartId) {
        return Flux.fromIterable(markdowns.values())
                .filter(m -> cartId.equals(m.cartId()))
                .filter(m -> m.expiresAt() == null || m.expiresAt().isAfter(Instant.now()));
    }

    @Override
    public Mono<Markdown> save(Markdown markdown) {
        markdowns.put(markdown.markdownId(), markdown);
        return Mono.just(markdown);
    }

    @Override
    public Mono<Void> delete(String markdownId) {
        markdowns.remove(markdownId);
        return Mono.empty();
    }
}
