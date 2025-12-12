plugins {
    id("platform.application-conventions")
}

dependencies {
    // Platform BOM for version management
    implementation(platform(project(":libs:backend:platform:platform-bom")))

    // Shared model libraries
    implementation(project(":libs:backend:shared-model:shared-model-product"))
    implementation(project(":libs:backend:shared-model:shared-model-customer"))
    implementation(project(":libs:backend:shared-model:shared-model-discount"))
    implementation(project(":libs:backend:shared-model:shared-model-fulfillment"))
    implementation(project(":libs:backend:shared-model:shared-model-order"))

    // Platform libraries
    implementation(project(":libs:backend:platform:platform-logging"))
    implementation(project(":libs:backend:platform:platform-resilience"))
    implementation(project(":libs:backend:platform:platform-cache"))
    implementation(project(":libs:backend:platform:platform-error"))
    implementation(project(":libs:backend:platform:platform-webflux"))
    implementation(project(":libs:backend:platform:platform-security"))
    implementation(project(":libs:backend:platform:platform-events"))

    // Spring Boot starters (versions from BOM)
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-webclient")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")

    // R2DBC PostgreSQL driver
    implementation("org.postgresql:r2dbc-postgresql")

    // Flyway for database migrations (Spring Boot 4.0 starter includes flyway-core + autoconfiguration)
    implementation("org.springframework.boot:spring-boot-starter-flyway")
    implementation("org.flywaydb:flyway-database-postgresql")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    runtimeOnly("org.postgresql:postgresql")

    // Prometheus metrics
    runtimeOnly("io.micrometer:micrometer-registry-prometheus")

    // Test dependencies
    testImplementation(project(":libs:backend:platform:platform-test"))
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:r2dbc")
    testImplementation("org.springframework.security:spring-security-test")

    // JDBC for Flyway in tests (Flyway needs JDBC DataSource, but app uses R2DBC)
    testImplementation("org.springframework.boot:spring-boot-starter-jdbc")

    // H2 for in-memory database in unit tests
    testImplementation("io.r2dbc:r2dbc-h2")
}
