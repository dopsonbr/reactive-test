plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:platform:platform-bom")))

    api("org.springframework.boot:spring-boot-starter-webflux")
    api(libs.bundles.resilience4j)
    api(libs.opentelemetry.api)

    // Logging integration
    implementation(project(":libs:platform:platform-logging"))

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}
