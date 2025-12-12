plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:backend:platform:platform-bom")))
    api("com.fasterxml.jackson.core:jackson-annotations")
}
