plugins {
    `java-platform`
}

javaPlatform {
    allowDependencies()
}

dependencies {
    // Import Spring Boot BOM as the foundation
    api(platform(org.springframework.boot.gradle.plugin.SpringBootPlugin.BOM_COORDINATES))

    // Import Testcontainers BOM
    api(platform(libs.testcontainers.bom))

    // Constrain non-BOM dependencies to specific versions
    constraints {
        api(libs.resilience4j.spring.boot)
        api(libs.resilience4j.reactor)
        api(libs.resilience4j.micrometer)
        api(libs.logstash.logback.encoder)
        api(libs.opentelemetry.api)
        api(libs.wiremock.standalone)
        api(libs.archunit.junit5)
    }
}
