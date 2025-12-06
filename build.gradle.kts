// Root build - minimal, delegates to convention plugins

plugins {
    base
    id("dev.nx.gradle.project-graph") version "+"
}

allprojects {
    group = "org.example.platform"
    version = "1.0.0-SNAPSHOT"
}

// Apply Nx plugin only to subprojects (not root) to avoid circular dependencies
subprojects {
    apply(plugin = "dev.nx.gradle.project-graph")
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
