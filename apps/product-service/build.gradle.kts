plugins {
    id("platform.application-conventions")
}

dependencies {
    // Platform BOM for version management
    implementation(platform(project(":libs:platform:platform-bom")))

    // Shared model libraries
    implementation(project(":libs:shared-model:shared-model-product"))

    // Platform libraries
    implementation(project(":libs:platform:platform-logging"))
    implementation(project(":libs:platform:platform-resilience"))
    implementation(project(":libs:platform:platform-cache"))
    implementation(project(":libs:platform:platform-error"))
    implementation(project(":libs:platform:platform-webflux"))
    implementation(project(":libs:platform:platform-security"))

    // Spring Boot starters (versions from BOM)
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-webclient")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-redis-reactive")

    // Prometheus metrics
    runtimeOnly("io.micrometer:micrometer-registry-prometheus")

    // OpenAPI documentation
    implementation("org.springdoc:springdoc-openapi-starter-webflux-ui:2.8.8")

    // Test dependencies
    testImplementation(project(":libs:platform:platform-test"))
}
