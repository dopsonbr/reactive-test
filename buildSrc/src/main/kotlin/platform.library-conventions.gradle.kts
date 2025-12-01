// Conventions for shared library modules
plugins {
    id("platform.java-conventions")
    `java-library`
}

// Libraries produce standard JARs (not executable)
tasks.named<Jar>("jar") {
    enabled = true
}
