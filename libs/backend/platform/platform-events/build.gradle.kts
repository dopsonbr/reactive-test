plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:backend:platform:platform-bom")))
    annotationProcessor(platform(project(":libs:backend:platform:platform-bom")))

    // CloudEvents SDK
    api(libs.bundles.cloudevents)

    // Spring Data Redis Reactive
    api("org.springframework.boot:spring-boot-starter-data-redis-reactive")

    // Jackson for JSON serialization
    api("com.fasterxml.jackson.core:jackson-databind")
    api("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

    // Platform libraries
    api(project(":libs:backend:platform:platform-logging"))

    // Auto-configuration support
    implementation("org.springframework.boot:spring-boot-autoconfigure")
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")

    // Test dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}
