package org.example.product;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.example.platform.test.architecture.ArchitectureRules;
import org.junit.jupiter.api.Tag;

/**
 * Architecture tests for product-service.
 *
 * <p>Extends the shared architecture rules from platform-test to enforce layered architecture and
 * coding standards.
 *
 * <p>Note: Domain-related rules are overridden because this service uses shared domain models from
 * libs/shared-model/shared-model-product instead of having a local domain package.
 */
@Tag("architecture")
@AnalyzeClasses(
    packages = "org.example.product",
    importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest extends ArchitectureRules {

  /**
   * Override layered architecture to exclude domain layer since domain classes are in a shared
   * library.
   */
  @ArchTest
  static final ArchRule layeredArchitecture =
      noClasses()
          .that()
          .resideInAPackage(CONTROLLER_PACKAGES)
          .should()
          .accessClassesThat()
          .resideInAPackage(REPOSITORY_PACKAGES)
          .allowEmptyShould(true)
          .because(
              "Controllers should use services for business logic, not repositories" + " directly");

  /**
   * Override: No domain package in this service - domain classes are in shared-model-product
   * library.
   */
  @ArchTest
  static final ArchRule domainClassesShouldNotHaveSpringAnnotations =
      classes()
          .that()
          .haveSimpleNameEndingWith("_PLACEHOLDER_FOR_NO_DOMAIN_")
          .should()
          .beRecords()
          .allowEmptyShould(true)
          .because("No local domain package - uses shared-model-product library");

  /**
   * Override: No domain package in this service - domain classes are in shared-model-product
   * library.
   */
  @ArchTest
  static final ArchRule domainClassesShouldNotDependOnFrameworks =
      classes()
          .that()
          .haveSimpleNameEndingWith("_PLACEHOLDER_FOR_NO_DOMAIN_")
          .should()
          .beRecords()
          .allowEmptyShould(true)
          .because("No local domain package - uses shared-model-product library");

  /**
   * Override: Controllers should not directly access repositories. Allow empty since this service
   * may not have repositories.
   */
  @ArchTest
  static final ArchRule controllersShouldNotAccessRepositories =
      noClasses()
          .that()
          .resideInAPackage(CONTROLLER_PACKAGES)
          .should()
          .accessClassesThat()
          .resideInAPackage(REPOSITORY_PACKAGES)
          .allowEmptyShould(true)
          .because(
              "Controllers should use services for business logic, not repositories" + " directly");

  /** Override: Controllers should be annotated with @RestController. Allow empty. */
  @ArchTest
  static final ArchRule controllersShouldBeAnnotated =
      classes()
          .that()
          .resideInAPackage(CONTROLLER_PACKAGES)
          .and()
          .haveSimpleNameEndingWith("Controller")
          .should()
          .beAnnotatedWith("org.springframework.web.bind.annotation.RestController")
          .allowEmptyShould(true)
          .because("Controllers should be annotated with @RestController");

  /** Override: Services should be annotated with @Service. Allow empty. */
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
          .allowEmptyShould(true)
          .because("Services should be annotated with @Service");

  /** Override: Repositories should be annotated with @Repository or @Component. Allow empty. */
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
          .allowEmptyShould(true)
          .because("Repositories should be annotated with @Repository or @Component");

  /** Override: No classes should depend on controllers (controllers are entry points). */
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
          .allowEmptyShould(true)
          .because("Controllers are entry points and should not be depended upon");
}
