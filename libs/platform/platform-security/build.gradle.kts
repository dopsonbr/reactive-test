plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:platform:platform-bom")))

    // Platform dependencies
    api(project(":libs:platform:platform-error"))

    // OAuth2 Resource Server (JWT validation)
    api("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    // OAuth2 Client (client credentials flow)
    api("org.springframework.boot:spring-boot-starter-oauth2-client")

    api("org.springframework.boot:spring-boot-starter-webflux")

    // OpenTelemetry for trace context in error handling
    implementation(libs.opentelemetry.api)

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
