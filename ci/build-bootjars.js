#!/usr/bin/env node

/**
 * Build bootable JARs for all applications
 *
 * Creates executable Spring Boot JARs that can be run with java -jar
 * or deployed to Docker containers.
 *
 * Usage: node build-bootjars.js [options]
 *
 * Options:
 *   --ci       Run in CI mode (no daemon, plain console output)
 *   --verbose  Show detailed output
 *   --help     Show this help message
 */

import { Logger } from './lib/logger.js';
import { runGradle, ROOT_DIR } from './lib/gradle.js';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const options = {
  ci: args.includes('--ci'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  help: args.includes('--help') || args.includes('-h'),
};

if (options.help) {
  console.log(`
Build bootable JARs for all applications

Creates executable Spring Boot JARs that can be run with java -jar
or deployed to Docker containers.

Usage: node build-bootjars.js [options]

Options:
  --ci       Run in CI mode (no daemon, plain console output)
  --verbose  Show detailed output
  --help     Show this help message
`);
  process.exit(0);
}

const logger = new Logger(options);

const APPLICATIONS = [
  { name: 'product-service', path: 'apps/product-service', port: 8090 },
  { name: 'cart-service', path: 'apps/cart-service', port: 8082 },
];

function formatSize(bytes) {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

function getJarInfo(appPath) {
  const libsPath = join(ROOT_DIR, appPath, 'build', 'libs');

  if (!existsSync(libsPath)) {
    return null;
  }

  const files = readdirSync(libsPath);
  const jarFile = files.find(f => f.endsWith('.jar') && !f.includes('plain'));

  if (!jarFile) {
    return null;
  }

  const fullPath = join(libsPath, jarFile);
  const stats = statSync(fullPath);

  return {
    name: jarFile,
    path: fullPath,
    size: stats.size,
    sizeFormatted: formatSize(stats.size),
    modified: stats.mtime,
  };
}

async function main() {
  logger.header('Build Boot JARs');
  logger.info(`Working directory: ${ROOT_DIR}`);

  logger.blank();
  logger.info('Applications to package:');
  for (const app of APPLICATIONS) {
    logger.bullet(`${app.name} (port ${app.port})`);
  }

  logger.blank();
  logger.running('Building bootable JARs...');

  const tasks = APPLICATIONS.map(app => `:${app.path.replace('/', ':')}:bootJar`).join(' ');

  const result = await runGradle({
    task: tasks,
    ci: options.ci,
    quiet: !options.verbose,
    onOutput: options.verbose ? (line) => logger.detail(line) : undefined,
  });

  logger.blank();

  if (result.success) {
    logger.pass('Boot JARs built successfully', result.duration);

    logger.blank();
    logger.info('Build artifacts:');
    logger.blank();

    for (const app of APPLICATIONS) {
      const jarInfo = getJarInfo(app.path);
      if (jarInfo) {
        logger.success(`${app.name}`);
        logger.detail(`File: ${jarInfo.name}`);
        logger.detail(`Size: ${jarInfo.sizeFormatted}`);
        logger.detail(`Path: ${app.path}/build/libs/`);
        logger.blank();
      } else {
        logger.warn(`${app.name}: JAR not found`);
      }
    }

    logger.info('Run locally with:');
    logger.detail('java -jar apps/product-service/build/libs/product-service.jar');
    logger.detail('java -jar apps/cart-service/build/libs/cart-service.jar');

    logger.blank();
    logger.info('Or use Docker Compose:');
    logger.detail('cd docker && docker compose up -d');
  } else {
    logger.fail('Boot JAR build failed', result.duration);
    logger.blank();
    logger.error('Review packaging errors above');
    logger.info('Common issues:');
    logger.bullet('Missing main class - check @SpringBootApplication');
    logger.bullet('Resource conflicts - check dependency exclusions');
    logger.bullet('Build failures - run ./gradlew build first');
  }

  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
