plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:platform:platform-bom")))

    // Core dependencies
    api("org.springframework.boot:spring-boot-starter-webflux")
    // Jackson 2 compatibility for Spring Boot 4.0
    api("org.springframework.boot:spring-boot-jackson2")
    api(libs.logstash.logback.encoder)
    api(libs.opentelemetry.api)

    // Context propagation
    implementation("io.micrometer:context-propagation")

    // Context classes from platform-webflux
    api(project(":libs:platform:platform-webflux"))

    // Test dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}
