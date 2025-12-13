plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:backend:platform:platform-bom")))
    annotationProcessor(platform(project(":libs:backend:platform:platform-bom")))

    // Platform libraries
    api(project(":libs:backend:platform:platform-events"))
    api(project(":libs:backend:platform:platform-logging"))
    api(project(":libs:backend:platform:platform-resilience"))

    // Core dependencies
    api("org.springframework.boot:spring-boot-starter-webflux")
    api("org.springframework.boot:spring-boot-starter-data-redis-reactive")
    // Jackson 2 compatibility for Spring Boot 4.0 (includes JSR-310 support)
    api("org.springframework.boot:spring-boot-jackson2")

    // Auto-configuration support
    implementation("org.springframework.boot:spring-boot-autoconfigure")
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")

    // Test dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}
