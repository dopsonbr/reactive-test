// Conventions for Spring Boot application modules
plugins {
    id("platform.java-conventions")
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

// Applications produce bootable JARs
springBoot {
    buildInfo()
}

tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    archiveClassifier.set("")
}

tasks.named<Jar>("jar") {
    enabled = false
}
