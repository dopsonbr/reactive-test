// Shared Java conventions for all modules
plugins {
    java
    id("com.diffplug.spotless")
}

group = "org.example.platform"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(25))
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

// JUnit Platform Launcher is required for Gradle 8.x with JUnit 5.12+
dependencies {
    "testRuntimeOnly"("org.junit.platform:junit-platform-launcher")
}

// Spotless code formatting
spotless {
    java {
        target("src/**/*.java")
        googleJavaFormat("1.33.0").reflowLongStrings()
        trimTrailingWhitespace()
        endWithNewline()
    }
}

// ============================================================================
// Architecture tests task (ArchUnit) - Phase 1
// ============================================================================
// Runs only tests tagged with "architecture" for independent execution
val testSourceSet = the<SourceSetContainer>()["test"]

tasks.register<Test>("archTest") {
    description = "Runs ArchUnit architecture tests"
    group = "verification"

    // Configure test classpath from test source set
    testClassesDirs = testSourceSet.output.classesDirs
    classpath = testSourceSet.runtimeClasspath

    useJUnitPlatform {
        includeTags("architecture")
    }

    // Run after regular tests if both are executed together
    shouldRunAfter(tasks.test)
}

// Exclude architecture tests from regular test task
tasks.test {
    useJUnitPlatform {
        excludeTags("architecture")
    }
}

// ============================================================================
// Lint task - Phase 2
// ============================================================================
// Combines spotlessCheck + archTest for comprehensive linting
tasks.register("lint") {
    description = "Runs all linting checks (Spotless + ArchUnit)"
    group = "verification"

    dependsOn("spotlessCheck", "archTest")
}

// ============================================================================
// Format tasks - Phase 3
// ============================================================================
// Format task (applies formatting)
tasks.register("format") {
    description = "Applies code formatting with Spotless"
    group = "formatting"

    dependsOn("spotlessApply")
}

// Format check task (validates without modifying)
tasks.register("format-check") {
    description = "Checks code formatting without modifying files"
    group = "verification"

    dependsOn("spotlessCheck")
}
