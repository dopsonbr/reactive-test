#!/usr/bin/env node

/**
 * Pre-merge Verification Script
 *
 * Runs all checks to ensure code is ready for merging:
 *   1. Check code formatting (Spotless)
 *   2. Build all modules
 *   3. Run architecture tests (ArchUnit)
 *   4. Run all unit tests
 *   5. Build boot JARs
 *
 * Usage: node verify.js [options]
 *
 * Options:
 *   --ci       Run in CI mode (no daemon, plain console output)
 *   --verbose  Show detailed output
 *   --help     Show this help message
 */

import { Logger } from './lib/logger.js';
import { runGradle, ROOT_DIR } from './lib/gradle.js';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  ci: args.includes('--ci'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  help: args.includes('--help') || args.includes('-h'),
};

if (options.help) {
  console.log(`
Pre-merge Verification Script

Runs all checks to ensure code is ready for merging:
  1. Check code formatting (Spotless)
  2. Build all modules
  3. Run architecture tests (ArchUnit)
  4. Run all unit tests
  5. Build boot JARs

Usage: node verify.js [options]

Options:
  --ci       Run in CI mode (no daemon, plain console output)
  --verbose  Show detailed output
  --help     Show this help message
`);
  process.exit(0);
}

const logger = new Logger(options);
const results = [];
const failures = [];

// Track overall timing
const overallStart = Date.now();

/**
 * Run a verification step
 */
async function runStep(stepNum, totalSteps, config) {
  const { label, task, args = [], fixCommand, docsLink } = config;

  logger.step(stepNum, totalSteps, label);
  logger.running(`Executing gradle ${task}...`);

  const result = await runGradle({
    task,
    args,
    ci: options.ci,
    quiet: !options.verbose,
    onOutput: options.verbose ? (line) => logger.detail(line) : undefined,
  });

  const stepResult = {
    label,
    status: result.success ? 'pass' : 'fail',
    duration: result.duration,
  };

  results.push(stepResult);

  if (result.success) {
    logger.pass(label, result.duration);
  } else {
    logger.fail(label, result.duration);
    failures.push({
      label,
      message: `Gradle task '${task}' failed with exit code ${result.exitCode}`,
      fix: fixCommand,
      docs: docsLink,
    });
  }

  return result.success;
}

/**
 * Main verification flow
 */
async function main() {
  const mode = options.ci ? 'CI' : 'Local';
  logger.header(`Pre-merge Verification (${mode} mode)`);

  logger.info(`Working directory: ${ROOT_DIR}`);
  logger.info(`Mode: ${mode}`);
  if (options.verbose) {
    logger.info('Verbose output enabled');
  }

  const steps = [
    {
      label: 'Code Formatting (Spotless)',
      task: 'spotlessCheck',
      fixCommand: './gradlew spotlessApply',
      docsLink: 'docs/standards/code-style.md',
    },
    {
      label: 'Build All Modules',
      task: 'buildAll',
      fixCommand: 'Review compilation errors above',
      docsLink: null,
    },
    {
      label: 'Architecture Tests (ArchUnit)',
      task: ':apps:product-service:test',
      args: ['--tests', '*ArchitectureTest*'],
      fixCommand: 'Fix architecture violations shown above',
      docsLink: 'docs/standards/architecture.md',
    },
    {
      label: 'Unit Tests',
      task: 'testAll',
      fixCommand: 'Fix failing tests shown above',
      docsLink: 'docs/standards/testing-unit.md',
    },
    {
      label: 'Build Boot JARs',
      task: ':apps:product-service:bootJar :apps:cart-service:bootJar',
      fixCommand: 'Review packaging errors above',
      docsLink: null,
    },
  ];

  // Run all steps
  let allPassed = true;
  for (let i = 0; i < steps.length; i++) {
    const success = await runStep(i + 1, steps.length, steps[i]);
    if (!success) {
      allPassed = false;
    }
  }

  // Check boot JARs exist
  logger.blank();
  logger.info('Verifying build artifacts...');

  const bootJars = [
    { path: 'apps/product-service/build/libs', name: 'product-service' },
    { path: 'apps/cart-service/build/libs', name: 'cart-service' },
  ];

  for (const jar of bootJars) {
    const fullPath = join(ROOT_DIR, jar.path);
    if (existsSync(fullPath)) {
      const files = readdirSync(fullPath);
      const jarFile = files.find(f => f.endsWith('.jar') && !f.includes('plain'));
      if (jarFile) {
        const stats = statSync(join(fullPath, jarFile));
        const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
        logger.bullet(`${jar.name}: ${jarFile} (${sizeMB} MB)`);
      }
    }
  }

  // Show failure details if any
  if (failures.length > 0) {
    logger.failureReport(failures);
  }

  // Show summary
  logger.summary(results);

  // Final timing
  const totalDuration = Date.now() - overallStart;
  logger.info(`Total verification time: ${Math.round(totalDuration / 1000)}s`);

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
