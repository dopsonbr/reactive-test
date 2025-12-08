plugins {
    id("platform.library-conventions")
}

dependencies {
    // Jackson annotations for computed properties
    api(platform(project(":libs:backend:platform:platform-bom")))
    api("com.fasterxml.jackson.core:jackson-annotations")
}
