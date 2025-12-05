package org.example.discount.repository;

import org.example.model.discount.Markdown;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Repository for managing employee markdowns. */
public interface MarkdownRepository {

    /**
     * Find a markdown by its ID.
     *
     * @param markdownId the markdown ID
     * @return the markdown if found
     */
    Mono<Markdown> findById(String markdownId);

    /**
     * Find all active (non-expired) markdowns for a cart.
     *
     * @param cartId the cart ID
     * @return stream of active markdowns
     */
    Flux<Markdown> findActiveByCart(String cartId);

    /**
     * Save a markdown.
     *
     * @param markdown the markdown to save
     * @return the saved markdown
     */
    Mono<Markdown> save(Markdown markdown);

    /**
     * Delete a markdown by ID.
     *
     * @param markdownId the markdown ID
     * @return completion signal
     */
    Mono<Void> delete(String markdownId);
}
