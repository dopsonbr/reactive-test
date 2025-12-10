package org.example.customer.controller;

import org.example.customer.controller.dto.CustomerSuggestion;
import org.example.customer.service.CustomerService;
import org.example.platform.webflux.context.ContextKeys;
import org.example.platform.webflux.context.RequestMetadata;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

/**
 * Controller for customer autocomplete/typeahead functionality. Provides fast, lightweight
 * suggestions for customer lookup during POS transactions.
 */
@RestController
@RequestMapping("/customers/autocomplete")
public class CustomerAutocompleteController {

  private final CustomerService customerService;

  public CustomerAutocompleteController(CustomerService customerService) {
    this.customerService = customerService;
  }

  /**
   * Get customer suggestions for autocomplete.
   *
   * @param q the search query (min 2 characters)
   * @param limit max number of suggestions (default 10, max 20)
   * @return list of customer suggestions
   */
  @GetMapping
  @PreAuthorize("hasAuthority('SCOPE_customer:read')")
  public Flux<CustomerSuggestion> autocomplete(
      @RequestParam String q,
      @RequestParam(defaultValue = "10") int limit,
      @RequestHeader("x-store-number") int storeNumber,
      @RequestHeader("x-order-number") String orderNumber,
      @RequestHeader("x-userid") String userId,
      @RequestHeader("x-sessionid") String sessionId) {

    if (q == null || q.length() < 2) {
      return Flux.empty();
    }

    int effectiveLimit = Math.min(limit, 20);
    RequestMetadata metadata = new RequestMetadata(storeNumber, orderNumber, userId, sessionId);

    return customerService
        .search(storeNumber, q)
        .take(effectiveLimit)
        .map(CustomerSuggestion::fromCustomer)
        .contextWrite(ctx -> ctx.put(ContextKeys.METADATA, metadata));
  }
}
