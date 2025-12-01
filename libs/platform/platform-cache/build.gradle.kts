plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:platform:platform-bom")))

    api("org.springframework.boot:spring-boot-starter-data-redis-reactive")
    api("com.fasterxml.jackson.core:jackson-databind")

    // Logging integration
    implementation(project(":libs:platform:platform-logging"))

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
    testImplementation(libs.testcontainers.core)
    testImplementation(libs.testcontainers.junit.jupiter)
}
