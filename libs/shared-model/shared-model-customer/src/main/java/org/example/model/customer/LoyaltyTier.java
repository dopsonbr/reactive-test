package org.example.model.customer;

/** Customer loyalty tier with points thresholds. */
public enum LoyaltyTier {
  BRONZE(1, 0),
  SILVER(2, 1000),
  GOLD(3, 5000),
  PLATINUM(4, 15000),
  DIAMOND(5, 50000);

  private final int level;
  private final long pointsRequired;

  LoyaltyTier(int level, long pointsRequired) {
    this.level = level;
    this.pointsRequired = pointsRequired;
  }

  public int getLevel() {
    return level;
  }

  public long getPointsRequired() {
    return pointsRequired;
  }

  /**
   * Determine the loyalty tier for a given points total.
   *
   * @param points the customer's lifetime points
   * @return the appropriate loyalty tier
   */
  public static LoyaltyTier forPoints(long points) {
    LoyaltyTier result = BRONZE;
    for (LoyaltyTier tier : values()) {
      if (points >= tier.pointsRequired) {
        result = tier;
      }
    }
    return result;
  }
}
