plugins {
    `kotlin-dsl`
}

repositories {
    mavenCentral()
    gradlePluginPortal()
}

dependencies {
    // Make Spring Boot plugin available to convention plugins
    implementation("org.springframework.boot:spring-boot-gradle-plugin:3.5.8")
    implementation("io.spring.gradle:dependency-management-plugin:1.1.7")
}
