plugins {
    id("platform.library-conventions")
}

dependencies {
    api(platform(project(":libs:backend:platform:platform-bom")))

    api("org.springframework.boot:spring-boot-starter-webflux")

    // Optional GraphQL support - services using AbstractGraphQlContextInterceptor
    // must have spring-boot-starter-graphql on their classpath
    compileOnly("org.springframework.graphql:spring-graphql")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.projectreactor:reactor-test")
}
