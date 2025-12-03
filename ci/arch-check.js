#!/usr/bin/env node

/**
 * Run architecture tests with ArchUnit
 *
 * Verifies all applications follow layered architecture patterns:
 * - Controllers don't access repositories directly
 * - Domain objects have no framework dependencies
 * - Proper layer dependencies are enforced
 *
 * Usage: node arch-check.js [options]
 *
 * Options:
 *   --ci       Run in CI mode (no daemon, plain console output)
 *   --verbose  Show detailed output including test results
 *   --help     Show this help message
 *
 * Exit codes:
 *   0 - All architecture rules pass
 *   1 - Architecture violations found
 */

import { Logger } from './lib/logger.js';
import { runGradle, ROOT_DIR } from './lib/gradle.js';

const args = process.argv.slice(2);
const options = {
  ci: args.includes('--ci'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  help: args.includes('--help') || args.includes('-h'),
};

if (options.help) {
  console.log(`
Run architecture tests with ArchUnit

Verifies all applications follow layered architecture patterns:
  - Controllers don't access repositories directly
  - Domain objects have no framework dependencies
  - Proper layer dependencies are enforced

Usage: node arch-check.js [options]

Options:
  --ci       Run in CI mode (no daemon, plain console output)
  --verbose  Show detailed output including test results
  --help     Show this help message

Exit codes:
  0 - All architecture rules pass
  1 - Architecture violations found
`);
  process.exit(0);
}

const logger = new Logger(options);

const ARCHITECTURE_RULES = [
  { name: 'layeredArchitecture', desc: 'Enforce layer dependencies (Controller → Service → Repository)' },
  { name: 'controllersShouldNotAccessRepositories', desc: 'Controllers use services, not repositories' },
  { name: 'domainClassesShouldNotHaveSpringAnnotations', desc: 'Domain objects are pure data' },
  { name: 'controllersShouldBeAnnotated', desc: 'Controllers have @RestController' },
  { name: 'servicesShouldBeAnnotated', desc: 'Services have @Service' },
  { name: 'repositoriesShouldBeAnnotated', desc: 'Repositories have @Repository' },
  { name: 'noClassesShouldDependOnControllers', desc: 'Controllers are entry points only' },
  { name: 'domainClassesShouldNotDependOnFrameworks', desc: 'Domain has no framework deps' },
];

async function main() {
  logger.header('Architecture Tests');
  logger.info(`Working directory: ${ROOT_DIR}`);

  logger.blank();
  logger.info('Architecture rules being verified:');
  for (const rule of ARCHITECTURE_RULES) {
    logger.bullet(`${rule.name}: ${rule.desc}`);
  }

  logger.blank();
  logger.running('Running ArchUnit tests...');

  const testResults = {
    passed: [],
    failed: [],
  };

  // Only run for product-service since cart-service doesn't have architecture tests yet
  // (cart-service is work-in-progress and lacks repository layer)
  const result = await runGradle({
    task: ':apps:product-service:test',
    args: ['--tests', '*ArchitectureTest*'],
    ci: options.ci,
    quiet: true,
    onOutput: (line) => {
      // Parse test results
      const passMatch = line.match(/ArchitectureTest > (\w+) PASSED/);
      if (passMatch) {
        testResults.passed.push(passMatch[1]);
      }

      const failMatch = line.match(/ArchitectureTest > (\w+) FAILED/);
      if (failMatch) {
        testResults.failed.push(failMatch[1]);
      }

      if (options.verbose) {
        logger.detail(line);
      }
    },
  });

  logger.blank();

  // Show test results
  if (testResults.passed.length > 0 || testResults.failed.length > 0) {
    logger.info('Test Results:');

    for (const test of testResults.passed) {
      logger.success(`${test}`);
    }

    for (const test of testResults.failed) {
      logger.error(`${test}`);
    }

    logger.blank();
    logger.info(`Summary: ${testResults.passed.length} passed, ${testResults.failed.length} failed`);
  }

  logger.blank();

  if (result.success) {
    logger.pass('All architecture rules pass', result.duration);
    logger.blank();
    logger.info('Layered architecture verified');
  } else {
    logger.fail('Architecture violations found', result.duration);

    if (testResults.failed.length > 0) {
      logger.blank();
      logger.warn('Failed rules:');
      for (const test of testResults.failed) {
        const rule = ARCHITECTURE_RULES.find(r => r.name === test);
        if (rule) {
          logger.bullet(`${test}: ${rule.desc}`);
        } else {
          logger.bullet(test);
        }
      }
    }

    logger.blank();
    logger.info('See docs/standards/architecture.md for architecture guidelines');
    logger.info('Review test output above for specific violations');
  }

  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
