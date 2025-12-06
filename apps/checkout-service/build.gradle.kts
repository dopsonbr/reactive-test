plugins {
    id("platform.application-conventions")
}

dependencies {
    // Platform BOM for version management
    implementation(platform(project(":libs:platform:platform-bom")))

    // Shared model libraries
    implementation(project(":libs:shared-model:shared-model-product"))
    implementation(project(":libs:shared-model:shared-model-customer"))
    implementation(project(":libs:shared-model:shared-model-discount"))
    implementation(project(":libs:shared-model:shared-model-fulfillment"))

    // Platform libraries
    implementation(project(":libs:platform:platform-logging"))
    implementation(project(":libs:platform:platform-resilience"))
    implementation(project(":libs:platform:platform-cache"))
    implementation(project(":libs:platform:platform-error"))
    implementation(project(":libs:platform:platform-webflux"))
    implementation(project(":libs:platform:platform-security"))

    // Spring Boot starters (versions from BOM)
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-webclient")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")

    // R2DBC PostgreSQL driver
    implementation("org.postgresql:r2dbc-postgresql")

    // Flyway for database migrations (requires JDBC driver)
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")

    // Prometheus metrics
    runtimeOnly("io.micrometer:micrometer-registry-prometheus")

    // Test dependencies
    testImplementation(project(":libs:platform:platform-test"))
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:r2dbc")
    testImplementation("org.springframework.security:spring-security-test")

    // JDBC for Flyway in tests (Flyway needs JDBC DataSource, but app uses R2DBC)
    testImplementation("org.springframework.boot:spring-boot-starter-jdbc")

    // H2 for in-memory database in unit tests
    testImplementation("io.r2dbc:r2dbc-h2")
}
