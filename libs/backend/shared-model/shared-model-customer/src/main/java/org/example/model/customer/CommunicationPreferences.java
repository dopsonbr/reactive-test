package org.example.model.customer;

/**
 * Customer communication preferences.
 *
 * @param emailOptIn whether the customer has opted in to email communications
 * @param smsOptIn whether the customer has opted in to SMS communications
 * @param pushOptIn whether the customer has opted in to push notifications
 * @param mailOptIn whether the customer has opted in to physical mail
 * @param preferredChannel the customer's preferred communication channel
 * @param preferredLanguage the customer's preferred language (ISO 639-1 code)
 * @param timezone the customer's timezone (IANA timezone identifier)
 */
public record CommunicationPreferences(
    boolean emailOptIn,
    boolean smsOptIn,
    boolean pushOptIn,
    boolean mailOptIn,
    PreferredChannel preferredChannel,
    String preferredLanguage,
    String timezone) {}
