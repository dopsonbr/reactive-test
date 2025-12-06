plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:backend:platform:platform-bom")))

    // Platform dependencies
    api(project(":libs:backend:platform:platform-error"))

    // OAuth2 Resource Server (JWT validation)
    api("org.springframework.boot:spring-boot-starter-security-oauth2-resource-server")
    // OAuth2 Client (client credentials flow)
    api("org.springframework.boot:spring-boot-starter-security-oauth2-client")

    api("org.springframework.boot:spring-boot-starter-webflux")
    // Jackson 2 compatibility for Spring Boot 4.0
    api("org.springframework.boot:spring-boot-jackson2")

    // OpenTelemetry for trace context in error handling
    implementation(libs.opentelemetry.api)

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
