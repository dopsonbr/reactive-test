// Root build - minimal, delegates to convention plugins

plugins {
    base
}

allprojects {
    group = "org.example.platform"
    version = "1.0.0-SNAPSHOT"
}

// Convenience tasks - only target leaf projects with actual build tasks
tasks.register("buildAll") {
    dependsOn(subprojects.filter { it.tasks.findByName("build") != null }.map { it.tasks.named("build") })
    description = "Build all modules"
    group = "build"
}

tasks.register("testAll") {
    dependsOn(subprojects.filter { it.tasks.findByName("test") != null }.map { it.tasks.named("test") })
    description = "Run tests in all modules"
    group = "verification"
}
