package org.example.checkout.client;

import java.math.BigDecimal;
import java.util.UUID;
import org.example.platform.resilience.ReactiveResilience;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Mock payment gateway client for MVP. Simulates payment processing with configurable
 * success/failure.
 *
 * <p>In production, this would be replaced with a real payment provider integration (Stripe,
 * Square, Adyen, etc.).
 */
@Component
public class PaymentGatewayClient {

  private static final Logger LOG = LoggerFactory.getLogger(PaymentGatewayClient.class);
  private static final String RESILIENCE_NAME = "payment";

  private final ReactiveResilience reactiveResilience;

  public PaymentGatewayClient(ReactiveResilience reactiveResilience) {
    this.reactiveResilience = reactiveResilience;
  }

  /**
   * Process a payment.
   *
   * @param request the payment request
   * @return the payment response
   */
  public Mono<PaymentResponse> processPayment(PaymentRequest request) {
    // Mock implementation - always succeeds for MVP
    Mono<PaymentResponse> mockResponse =
        Mono.fromCallable(
            () -> {
              LOG.info(
                  "Processing mock payment: amount={}, method={}",
                  request.amount(),
                  request.paymentMethod());

              // Simulate processing delay
              Thread.sleep(100);

              // Generate mock payment reference
              String paymentReference =
                  "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

              return new PaymentResponse(
                  true, paymentReference, "Payment processed successfully", request.amount());
            });

    return reactiveResilience.decorate(RESILIENCE_NAME, mockResponse);
  }

  /**
   * Refund a payment.
   *
   * @param paymentReference the original payment reference
   * @param amount the amount to refund
   * @return the refund response
   */
  public Mono<RefundResponse> refundPayment(String paymentReference, BigDecimal amount) {
    Mono<RefundResponse> mockResponse =
        Mono.fromCallable(
            () -> {
              LOG.info("Processing mock refund: reference={}, amount={}", paymentReference, amount);

              String refundReference =
                  "REF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

              return new RefundResponse(true, refundReference, "Refund processed successfully");
            });

    return reactiveResilience.decorate(RESILIENCE_NAME, mockResponse);
  }

  /** Payment request. */
  public record PaymentRequest(
      String orderId,
      BigDecimal amount,
      String paymentMethod,
      PaymentDetails paymentDetails,
      String customerId,
      int storeNumber) {}

  /** Payment method-specific details. */
  public record PaymentDetails(
      String cardLast4, String cardBrand, String cardToken, String billingZip) {}

  /** Payment response. */
  public record PaymentResponse(
      boolean success, String paymentReference, String message, BigDecimal chargedAmount) {}

  /** Refund response. */
  public record RefundResponse(boolean success, String refundReference, String message) {}
}
