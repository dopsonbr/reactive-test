plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:platform:platform-bom")))

    // Placeholder dependencies - uncomment when implementing OAuth2/JWT
    // api("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    // api("org.springframework.boot:spring-boot-starter-oauth2-client")

    api("org.springframework.boot:spring-boot-starter-webflux")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
