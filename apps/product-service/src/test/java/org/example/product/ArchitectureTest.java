package org.example.product;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import org.example.platform.test.architecture.ArchitectureRules;

/**
 * Architecture tests for product-service.
 *
 * <p>Extends the shared architecture rules from platform-test to enforce layered architecture and
 * coding standards.
 */
@AnalyzeClasses(
        packages = "org.example.product",
        importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest extends ArchitectureRules {}
