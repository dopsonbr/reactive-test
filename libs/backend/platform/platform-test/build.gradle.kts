plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:backend:platform:platform-bom")))

    api("org.springframework.boot:spring-boot-starter-test")
    // WebFlux test support for @WebFluxTest annotation
    api("org.springframework.boot:spring-boot-starter-webflux-test")
    api("io.projectreactor:reactor-test")
    api(libs.testcontainers.core)
    api(libs.testcontainers.junit.jupiter)
    api(libs.wiremock.standalone)

    // Architecture testing
    api(libs.archunit.junit5)

    // JWT generation for security tests
    api(libs.bundles.jjwt)

    // OAuth2 JWT decoder for TestSecurityConfig
    api("org.springframework.boot:spring-boot-starter-security-oauth2-resource-server")

    // Access to platform modules for test helpers
    implementation(project(":libs:backend:platform:platform-logging"))
    implementation(project(":libs:backend:platform:platform-cache"))
}
