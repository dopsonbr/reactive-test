plugins {
    id("platform.application-conventions")
}

dependencies {
    // Platform BOM for version management
    implementation(platform(project(":libs:backend:platform:platform-bom")))

    // Platform libraries
    implementation(project(":libs:backend:platform:platform-logging"))
    implementation(project(":libs:backend:platform:platform-error"))
    implementation(project(":libs:backend:platform:platform-webflux"))

    // Spring Boot starters (versions from BOM)
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-r2dbc")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-security")

    // Spring Security OAuth2 for JWT
    implementation("org.springframework.security:spring-security-oauth2-jose")

    // PostgreSQL (R2DBC)
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
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}
