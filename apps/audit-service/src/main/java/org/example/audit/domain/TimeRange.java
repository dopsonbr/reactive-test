package org.example.audit.domain;

import java.time.Instant;

/**
 * Represents a time range for querying audit events.
 *
 * @param start Start of the time range (inclusive), null for no lower bound
 * @param end End of the time range (exclusive), null for no upper bound
 */
public record TimeRange(Instant start, Instant end) {

  /** Creates an unbounded time range. */
  public static TimeRange unbounded() {
    return new TimeRange(null, null);
  }

  /**
   * Creates a time range from the given start time to now.
   *
   * @param start Start time (inclusive)
   * @return TimeRange from start to now
   */
  public static TimeRange since(Instant start) {
    return new TimeRange(start, null);
  }

  /**
   * Creates a time range from the beginning of time to the given end.
   *
   * @param end End time (exclusive)
   * @return TimeRange from beginning to end
   */
  public static TimeRange until(Instant end) {
    return new TimeRange(null, end);
  }

  /**
   * Creates a time range between two instants.
   *
   * @param start Start time (inclusive)
   * @param end End time (exclusive)
   * @return TimeRange between start and end
   */
  public static TimeRange between(Instant start, Instant end) {
    return new TimeRange(start, end);
  }

  /** Returns true if this time range has a start bound. */
  public boolean hasStart() {
    return start != null;
  }

  /** Returns true if this time range has an end bound. */
  public boolean hasEnd() {
    return end != null;
  }
}
