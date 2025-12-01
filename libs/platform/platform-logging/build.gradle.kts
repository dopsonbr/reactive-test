plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:platform:platform-bom")))

    // Core dependencies
    api("org.springframework.boot:spring-boot-starter-webflux")
    api("com.fasterxml.jackson.core:jackson-databind")
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
