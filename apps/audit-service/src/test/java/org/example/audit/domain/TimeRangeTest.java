package org.example.audit.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class TimeRangeTest {

  @Test
  void unbounded_hasNoStartOrEnd() {
    TimeRange range = TimeRange.unbounded();

    assertThat(range.start()).isNull();
    assertThat(range.end()).isNull();
    assertThat(range.hasStart()).isFalse();
    assertThat(range.hasEnd()).isFalse();
  }

  @Test
  void since_hasStartButNoEnd() {
    Instant start = Instant.parse("2024-01-01T00:00:00Z");
    TimeRange range = TimeRange.since(start);

    assertThat(range.start()).isEqualTo(start);
    assertThat(range.end()).isNull();
    assertThat(range.hasStart()).isTrue();
    assertThat(range.hasEnd()).isFalse();
  }

  @Test
  void until_hasEndButNoStart() {
    Instant end = Instant.parse("2024-12-31T23:59:59Z");
    TimeRange range = TimeRange.until(end);

    assertThat(range.start()).isNull();
    assertThat(range.end()).isEqualTo(end);
    assertThat(range.hasStart()).isFalse();
    assertThat(range.hasEnd()).isTrue();
  }

  @Test
  void between_hasBothStartAndEnd() {
    Instant start = Instant.parse("2024-01-01T00:00:00Z");
    Instant end = Instant.parse("2024-12-31T23:59:59Z");
    TimeRange range = TimeRange.between(start, end);

    assertThat(range.start()).isEqualTo(start);
    assertThat(range.end()).isEqualTo(end);
    assertThat(range.hasStart()).isTrue();
    assertThat(range.hasEnd()).isTrue();
  }

  @Test
  void constructor_withNullValues_createsUnboundedRange() {
    TimeRange range = new TimeRange(null, null);

    assertThat(range.hasStart()).isFalse();
    assertThat(range.hasEnd()).isFalse();
  }

  @Test
  void recordEquality_worksCorrectly() {
    Instant start = Instant.parse("2024-06-01T00:00:00Z");
    Instant end = Instant.parse("2024-06-30T23:59:59Z");

    TimeRange range1 = new TimeRange(start, end);
    TimeRange range2 = TimeRange.between(start, end);

    assertThat(range1).isEqualTo(range2);
    assertThat(range1.hashCode()).isEqualTo(range2.hashCode());
  }
}
