#!/usr/bin/env node

/**
 * Build all modules (platform libraries and applications)
 *
 * Usage: node build-all.js [options]
 *
 * Options:
 *   --ci       Run in CI mode (no daemon, plain console output)
 *   --verbose  Show detailed output
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
Build all modules (platform libraries and applications)

Usage: node build-all.js [options]

Options:
  --ci       Run in CI mode (no daemon, plain console output)
  --verbose  Show detailed output
  --help     Show this help message
`);
  process.exit(0);
}

const logger = new Logger(options);

const MODULES = {
  platform: [
    'platform-bom',
    'platform-logging',
    'platform-resilience',
    'platform-cache',
    'platform-error',
    'platform-webflux',
    'platform-security',
    'platform-test',
  ],
  apps: [
    'product-service',
    'cart-service',
  ],
};

async function main() {
  logger.header('Build All Modules');
  logger.info(`Working directory: ${ROOT_DIR}`);

  logger.blank();
  logger.info('Modules to build:');
  logger.blank();
  logger.info('Platform Libraries:');
  for (const mod of MODULES.platform) {
    logger.bullet(mod);
  }
  logger.blank();
  logger.info('Applications:');
  for (const app of MODULES.apps) {
    logger.bullet(app);
  }

  logger.blank();
  logger.running('Building all modules...');

  const result = await runGradle({
    task: 'buildAll',
    ci: options.ci,
    quiet: !options.verbose,
    onOutput: options.verbose ? (line) => logger.detail(line) : undefined,
  });

  logger.blank();

  if (result.success) {
    logger.pass('All modules built successfully', result.duration);
    logger.blank();
    logger.info('Build artifacts:');
    logger.bullet('libs/platform/*/build/libs/*.jar');
    logger.bullet('apps/*/build/libs/*.jar');
  } else {
    logger.fail('Build failed', result.duration);
    logger.blank();
    logger.error('Review compilation errors above');
    logger.info('Common issues:');
    logger.bullet('Missing dependencies - check build.gradle.kts');
    logger.bullet('Syntax errors - check source files');
    logger.bullet('Type mismatches - verify API compatibility');
  }

  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
