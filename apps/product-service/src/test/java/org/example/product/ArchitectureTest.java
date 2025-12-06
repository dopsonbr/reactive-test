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
}
