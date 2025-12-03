package org.example.platform.test.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/**
 * Shared architecture rules for all applications.
 *
 * <p>To use in an application, create a test class that extends this and annotate with
 * {@code @AnalyzeClasses}.
 *
 * <p>Example:
 *
 * <pre>{@code
 * @AnalyzeClasses(packages = "org.example.product", importOptions = ImportOption.DoNotIncludeTests.class)
 * class ArchitectureTest extends ArchitectureRules {}
 * }</pre>
 */
public abstract class ArchitectureRules {

    // Layer definitions
    protected static final String CONTROLLER_LAYER = "Controller";
    protected static final String SERVICE_LAYER = "Service";
    protected static final String REPOSITORY_LAYER = "Repository";
    protected static final String DOMAIN_LAYER = "Domain";
    protected static final String CONFIG_LAYER = "Config";
    protected static final String VALIDATION_LAYER = "Validation";

    // Package patterns
    protected static final String CONTROLLER_PACKAGES = "..controller..";
    protected static final String SERVICE_PACKAGES = "..service..";
    protected static final String REPOSITORY_PACKAGES = "..repository..";
    protected static final String DOMAIN_PACKAGES = "..domain..";
    protected static final String CONFIG_PACKAGES = "..config..";
    protected static final String VALIDATION_PACKAGES = "..validation..";

    /**
     * Enforce layered architecture dependencies.
     *
     * <p>This rule focuses on preventing incorrect layer access patterns while allowing necessary
     * framework dependencies.
     */
    @ArchTest
    static final ArchRule layeredArchitecture =
            layeredArchitecture()
                    .consideringOnlyDependenciesInLayers()
                    .layer(CONTROLLER_LAYER)
                    .definedBy(CONTROLLER_PACKAGES)
                    .layer(SERVICE_LAYER)
                    .definedBy(SERVICE_PACKAGES)
                    .layer(REPOSITORY_LAYER)
                    .definedBy(REPOSITORY_PACKAGES)
                    .layer(DOMAIN_LAYER)
                    .definedBy(DOMAIN_PACKAGES)
                    .layer(CONFIG_LAYER)
                    .definedBy(CONFIG_PACKAGES)
                    .layer(VALIDATION_LAYER)
                    .definedBy(VALIDATION_PACKAGES)
                    // Controllers can access services, domain, validation, but NOT repositories
                    // directly
                    .whereLayer(CONTROLLER_LAYER)
                    .mayOnlyAccessLayers(
                            SERVICE_LAYER, DOMAIN_LAYER, CONFIG_LAYER, VALIDATION_LAYER)
                    // Services can access repositories and domain
                    .whereLayer(SERVICE_LAYER)
                    .mayOnlyAccessLayers(REPOSITORY_LAYER, DOMAIN_LAYER, CONFIG_LAYER)
                    // Repositories can only access domain and config
                    .whereLayer(REPOSITORY_LAYER)
                    .mayOnlyAccessLayers(DOMAIN_LAYER, CONFIG_LAYER)
                    // Domain should not depend on other application layers
                    .whereLayer(DOMAIN_LAYER)
                    .mayNotAccessAnyLayer()
                    // Config can access domain
                    .whereLayer(CONFIG_LAYER)
                    .mayOnlyAccessLayers(DOMAIN_LAYER)
                    // Validation can access domain
                    .whereLayer(VALIDATION_LAYER)
                    .mayOnlyAccessLayers(DOMAIN_LAYER);

    /** Controllers should not directly access repositories. */
    @ArchTest
    static final ArchRule controllersShouldNotAccessRepositories =
            noClasses()
                    .that()
                    .resideInAPackage(CONTROLLER_PACKAGES)
                    .should()
                    .accessClassesThat()
                    .resideInAPackage(REPOSITORY_PACKAGES)
                    .because(
                            "Controllers should use services for business logic, not repositories"
                                    + " directly");

    /** Domain classes should be records or simple POJOs without Spring dependencies. */
    @ArchTest
    static final ArchRule domainClassesShouldNotHaveSpringAnnotations =
            noClasses()
                    .that()
                    .resideInAPackage(DOMAIN_PACKAGES)
                    .should()
                    .beAnnotatedWith("org.springframework.stereotype.Component")
                    .orShould()
                    .beAnnotatedWith("org.springframework.stereotype.Service")
                    .orShould()
                    .beAnnotatedWith("org.springframework.stereotype.Repository")
                    .orShould()
                    .beAnnotatedWith("org.springframework.stereotype.Controller")
                    .orShould()
                    .beAnnotatedWith("org.springframework.web.bind.annotation.RestController")
                    .because(
                            "Domain classes should be pure data objects without Spring"
                                    + " annotations");

    /** Controllers should be annotated with @RestController. */
    @ArchTest
    static final ArchRule controllersShouldBeAnnotated =
            classes()
                    .that()
                    .resideInAPackage(CONTROLLER_PACKAGES)
                    .and()
                    .haveSimpleNameEndingWith("Controller")
                    .should()
                    .beAnnotatedWith("org.springframework.web.bind.annotation.RestController")
                    .because("Controllers should be annotated with @RestController");

    /** Services should be annotated with @Service. */
    @ArchTest
    static final ArchRule servicesShouldBeAnnotated =
            classes()
                    .that()
                    .resideInAPackage(SERVICE_PACKAGES)
                    .and()
                    .haveSimpleNameEndingWith("Service")
                    .and()
                    .areNotInterfaces()
                    .should()
                    .beAnnotatedWith("org.springframework.stereotype.Service")
                    .because("Services should be annotated with @Service");

    /** Repositories should be annotated with @Repository or @Component. */
    @ArchTest
    static final ArchRule repositoriesShouldBeAnnotated =
            classes()
                    .that()
                    .resideInAPackage(REPOSITORY_PACKAGES)
                    .and()
                    .haveSimpleNameEndingWith("Repository")
                    .and()
                    .areNotInterfaces()
                    .should()
                    .beAnnotatedWith("org.springframework.stereotype.Repository")
                    .orShould()
                    .beAnnotatedWith("org.springframework.stereotype.Component")
                    .because("Repositories should be annotated with @Repository or @Component");

    /** No classes should depend on controllers (controllers are entry points). */
    @ArchTest
    static final ArchRule noClassesShouldDependOnControllers =
            noClasses()
                    .that()
                    .resideOutsideOfPackage(CONTROLLER_PACKAGES)
                    .and()
                    .resideOutsideOfPackage(CONFIG_PACKAGES)
                    .should()
                    .dependOnClassesThat()
                    .resideInAPackage(CONTROLLER_PACKAGES)
                    .because("Controllers are entry points and should not be depended upon");

    /** Domain classes should only be records (preferred) or simple classes. */
    @ArchTest
    static final ArchRule domainClassesShouldNotDependOnFrameworks =
            noClasses()
                    .that()
                    .resideInAPackage(DOMAIN_PACKAGES)
                    .should()
                    .dependOnClassesThat()
                    .resideInAnyPackage(
                            "org.springframework..",
                            "io.github.resilience4j..",
                            "reactor.core..",
                            "io.lettuce..")
                    .because("Domain classes should be pure data without framework dependencies");
}
