package org.example.platform.audit;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class AuditPropertiesTest {

    @Test
    void defaultConstructor_setsDefaults() {
        AuditProperties properties = new AuditProperties();

        assertThat(properties.enabled()).isFalse();
        assertThat(properties.streamKey()).isEqualTo("audit-events");
        assertThat(properties.publishTimeout()).isEqualTo(Duration.ofMillis(500));
    }

    @Test
    void constructor_withNullValues_usesDefaults() {
        AuditProperties properties = new AuditProperties(true, null, null);

        assertThat(properties.enabled()).isTrue();
        assertThat(properties.streamKey()).isEqualTo("audit-events");
        assertThat(properties.publishTimeout()).isEqualTo(Duration.ofMillis(500));
    }

    @Test
    void constructor_withCustomValues_usesProvidedValues() {
        AuditProperties properties =
                new AuditProperties(true, "custom-stream", Duration.ofSeconds(2));

        assertThat(properties.enabled()).isTrue();
        assertThat(properties.streamKey()).isEqualTo("custom-stream");
        assertThat(properties.publishTimeout()).isEqualTo(Duration.ofSeconds(2));
    }
}
