#!/usr/bin/env node

/**
 * Check code formatting with Spotless
 *
 * Verifies all Java code follows Google Java Format style.
 * Use format-apply.js to fix any formatting issues.
 *
 * Usage: node format-check.js [options]
 *
 * Options:
 *   --ci       Run in CI mode (no daemon, plain console output)
 *   --verbose  Show detailed output including specific violations
 *   --help     Show this help message
 *
 * Exit codes:
 *   0 - All code is properly formatted
 *   1 - Formatting issues found
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
Check code formatting with Spotless

Verifies all Java code follows Google Java Format style.

Usage: node format-check.js [options]

Options:
  --ci       Run in CI mode (no daemon, plain console output)
  --verbose  Show detailed output including specific violations
  --help     Show this help message

Exit codes:
  0 - All code is properly formatted
  1 - Formatting issues found (run format-apply.js to fix)
`);
  process.exit(0);
}

const logger = new Logger(options);

async function main() {
  logger.header('Code Formatting Check');
  logger.info(`Working directory: ${ROOT_DIR}`);
  logger.running('Checking code formatting with Spotless...');

  const violations = [];

  const result = await runGradle({
    task: 'spotlessCheck',
    ci: options.ci,
    quiet: true,
    onOutput: (line) => {
      // Capture file violations
      const fileMatch = line.match(/^\s+(src\/.*\.java)$/);
      if (fileMatch) {
        violations.push(fileMatch[1]);
      }

      if (options.verbose) {
        logger.detail(line);
      }
    },
  });

  logger.blank();

  if (result.success) {
    logger.pass('All code is properly formatted', result.duration);
    logger.blank();
    logger.info('Google Java Format standards verified');
  } else {
    logger.fail('Formatting issues found', result.duration);

    if (violations.length > 0) {
      logger.blank();
      logger.info(`${violations.length} file(s) with formatting issues:`);
      for (const file of violations.slice(0, 10)) {
        logger.bullet(file);
      }
      if (violations.length > 10) {
        logger.bullet(`... and ${violations.length - 10} more`);
      }
    }

    logger.blank();
    logger.warn('To fix formatting issues, run:');
    logger.detail('./gradlew spotlessApply');
    logger.detail('node ci/format-apply.js');
    logger.blank();
    logger.info('See docs/standards/code-style.md for style guidelines');
  }

  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
