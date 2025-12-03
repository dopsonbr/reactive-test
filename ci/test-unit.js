#!/usr/bin/env node

/**
 * Run all unit tests
 *
 * Executes unit tests for all platform libraries and applications.
 *
 * Usage: node test-unit.js [options]
 *
 * Options:
 *   --ci       Run in CI mode (no daemon, plain console output)
 *   --verbose  Show detailed output including individual test results
 *   --help     Show this help message
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
Run all unit tests

Executes unit tests for all platform libraries and applications.

Usage: node test-unit.js [options]

Options:
  --ci       Run in CI mode (no daemon, plain console output)
  --verbose  Show detailed output including individual test results
  --help     Show this help message
`);
  process.exit(0);
}

const logger = new Logger(options);

async function main() {
  logger.header('Unit Tests');
  logger.info(`Working directory: ${ROOT_DIR}`);

  logger.blank();
  logger.running('Running all unit tests...');

  const testStats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    modules: {},
  };

  let currentModule = null;

  const result = await runGradle({
    task: 'testAll',
    ci: options.ci,
    quiet: true,
    onOutput: (line) => {
      // Track current module
      const moduleMatch = line.match(/> Task :(.+):test/);
      if (moduleMatch) {
        currentModule = moduleMatch[1];
        testStats.modules[currentModule] = { passed: 0, failed: 0 };
      }

      // Parse test counts from summary lines
      const countMatch = line.match(/(\d+) tests? completed(?:, (\d+) failed)?(?:, (\d+) skipped)?/);
      if (countMatch && currentModule) {
        const completed = parseInt(countMatch[1], 10);
        const failed = parseInt(countMatch[2] || '0', 10);
        const skipped = parseInt(countMatch[3] || '0', 10);

        testStats.total += completed;
        testStats.failed += failed;
        testStats.skipped += skipped;
        testStats.passed += completed - failed;

        testStats.modules[currentModule].passed = completed - failed;
        testStats.modules[currentModule].failed = failed;
      }

      // Show individual test results in verbose mode
      if (options.verbose) {
        if (line.includes('PASSED') || line.includes('FAILED') || line.includes('SKIPPED')) {
          logger.detail(line.trim());
        }
      }
    },
  });

  logger.blank();

  // Show module breakdown
  const moduleNames = Object.keys(testStats.modules);
  if (moduleNames.length > 0) {
    logger.info('Test Results by Module:');
    logger.blank();

    for (const moduleName of moduleNames) {
      const stats = testStats.modules[moduleName];
      const status = stats.failed === 0 ? 'pass' : 'fail';

      if (status === 'pass') {
        logger.success(`${moduleName}: ${stats.passed} passed`);
      } else {
        logger.error(`${moduleName}: ${stats.passed} passed, ${stats.failed} failed`);
      }
    }

    logger.blank();
  }

  // Overall summary
  logger.info('Overall Summary:');
  logger.bullet(`Total: ${testStats.total} tests`);
  logger.bullet(`Passed: ${testStats.passed}`);
  if (testStats.failed > 0) {
    logger.bullet(`Failed: ${testStats.failed}`);
  }
  if (testStats.skipped > 0) {
    logger.bullet(`Skipped: ${testStats.skipped}`);
  }

  logger.blank();

  if (result.success) {
    logger.pass('All tests passed', result.duration);
    logger.blank();
    logger.info('Test reports available at:');
    logger.bullet('libs/platform/*/build/reports/tests/test/index.html');
    logger.bullet('apps/*/build/reports/tests/test/index.html');
  } else {
    logger.fail('Some tests failed', result.duration);
    logger.blank();
    logger.error('Review failing tests above');
    logger.info('Test reports with details:');
    logger.bullet('apps/*/build/reports/tests/test/index.html');
    logger.blank();
    logger.info('Run specific tests with:');
    logger.detail('./gradlew :apps:product-service:test --tests "ClassName.methodName"');
  }

  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
