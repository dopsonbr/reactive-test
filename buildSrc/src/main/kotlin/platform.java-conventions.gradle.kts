// Shared Java conventions for all modules
plugins {
    java
}

group = "org.example.platform"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
}

tasks.withType<Test> {
    useJUnitPlatform()
    testLogging {
        events("passed", "skipped", "failed")
    }
    // Testcontainers configuration - RYUK disabled for Rancher Desktop/Colima
    environment("TESTCONTAINERS_RYUK_DISABLED", "true")
}
