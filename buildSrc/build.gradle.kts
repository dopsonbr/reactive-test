plugins {
    `kotlin-dsl`
}

repositories {
    mavenCentral()
    gradlePluginPortal()
}

dependencies {
    // Make Spring Boot plugin available to convention plugins
    implementation("org.springframework.boot:spring-boot-gradle-plugin:4.0.0")
    implementation("io.spring.gradle:dependency-management-plugin:1.1.7")
    // Code formatting
    implementation("com.diffplug.spotless:spotless-plugin-gradle:7.0.0.BETA4")
}
