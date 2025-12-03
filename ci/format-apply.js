#!/usr/bin/env node

/**
 * Apply code formatting with Spotless
 *
 * Automatically formats all Java code to follow Google Java Format style.
 *
 * Usage: node format-apply.js [options]
 *
 * Options:
 *   --ci       Run in CI mode (no daemon, plain console output)
 *   --verbose  Show detailed output
 *   --help     Show this help message
 */

import { Logger } from './lib/logger.js';
import { runGradle, getModifiedFiles, ROOT_DIR } from './lib/gradle.js';

const args = process.argv.slice(2);
const options = {
  ci: args.includes('--ci'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  help: args.includes('--help') || args.includes('-h'),
};

if (options.help) {
  console.log(`
Apply code formatting with Spotless

Automatically formats all Java code to follow Google Java Format style.

Usage: node format-apply.js [options]

Options:
  --ci       Run in CI mode (no daemon, plain console output)
  --verbose  Show detailed output
  --help     Show this help message
`);
  process.exit(0);
}

const logger = new Logger(options);

async function main() {
  logger.header('Apply Code Formatting');
  logger.info(`Working directory: ${ROOT_DIR}`);

  // Get files before formatting
  const beforeFiles = await getModifiedFiles();

  logger.running('Applying code formatting with Spotless...');

  const result = await runGradle({
    task: 'spotlessApply',
    ci: options.ci,
    quiet: !options.verbose,
    onOutput: options.verbose ? (line) => logger.detail(line) : undefined,
  });

  logger.blank();

  if (result.success) {
    // Get files after formatting
    const afterFiles = await getModifiedFiles();

    // Find newly modified files
    const beforeSet = new Set(beforeFiles.map(f => f.file));
    const newlyModified = afterFiles.filter(f => !beforeSet.has(f.file));

    logger.pass('Code formatting applied successfully', result.duration);

    if (newlyModified.length > 0) {
      logger.blank();
      logger.info(`${newlyModified.length} file(s) were reformatted:`);
      for (const file of newlyModified.slice(0, 10)) {
        logger.bullet(file.file);
      }
      if (newlyModified.length > 10) {
        logger.bullet(`... and ${newlyModified.length - 10} more`);
      }
      logger.blank();
      logger.info('Review changes with: git diff');
      logger.info('Commit when ready: git add -A && git commit -m "Apply code formatting"');
    } else {
      logger.blank();
      logger.info('No files needed reformatting');
    }
  } else {
    logger.fail('Failed to apply formatting', result.duration);
    logger.blank();
    logger.error('Review the error output above');
  }

  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
