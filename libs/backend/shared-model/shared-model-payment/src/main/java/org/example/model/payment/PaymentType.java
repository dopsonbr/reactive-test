package org.example.model.payment;

/** Types of payment methods supported by the POS system. */
public enum PaymentType {
  /** Physical card present - swipe, dip, or tap */
  CARD,
  /** Card not present - phone/mail order */
  CARD_NOT_PRESENT,
  /** Cash payment */
  CASH,
  /** Gift card payment */
  GIFT_CARD,
  /** Customer wallet with saved payment methods */
  WALLET,
  /** B2B net terms (invoice billing) */
  NET_TERMS,
  /** Split payment across multiple methods */
  SPLIT
}
