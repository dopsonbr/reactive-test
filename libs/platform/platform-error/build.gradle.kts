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

    // Security exceptions - optional, only needed for apps using OAuth
    compileOnly("org.springframework.boot:spring-boot-starter-security")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}
