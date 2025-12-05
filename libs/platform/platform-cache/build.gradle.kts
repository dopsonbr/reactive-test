plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:platform:platform-bom")))

    api("org.springframework.boot:spring-boot-starter-data-redis-reactive")
    // Jackson 2 compatibility for Spring Boot 4.0
    api("org.springframework.boot:spring-boot-jackson2")

    // Logging integration
    implementation(project(":libs:platform:platform-logging"))

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
    testImplementation(libs.testcontainers.core)
    testImplementation(libs.testcontainers.junit.jupiter)
}
