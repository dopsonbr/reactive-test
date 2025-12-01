plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:platform:platform-bom")))

    api("org.springframework.boot:spring-boot-starter-test")
    api("io.projectreactor:reactor-test")
    api(libs.testcontainers.core)
    api(libs.testcontainers.junit.jupiter)
    api(libs.wiremock.standalone)

    // JWT generation for security tests
    api(libs.bundles.jjwt)

    // Access to platform modules for test helpers
    implementation(project(":libs:platform:platform-logging"))
    implementation(project(":libs:platform:platform-cache"))
}
