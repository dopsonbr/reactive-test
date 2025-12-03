/**
 * Gradle execution utilities for CI scripts
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..', '..');

/**
 * Execute a Gradle command and capture output
 *
 * @param {Object} options
 * @param {string} options.task - Gradle task to run
 * @param {string[]} [options.args] - Additional arguments
 * @param {boolean} [options.ci] - CI mode (no daemon, plain console)
 * @param {boolean} [options.quiet] - Suppress output
 * @param {Function} [options.onOutput] - Callback for output lines
 * @returns {Promise<{success: boolean, duration: number, output: string, exitCode: number}>}
 */
export async function runGradle(options) {
  const { task, args = [], ci = false, quiet = false, onOutput } = options;

  const gradleArgs = [task, ...args];

  if (ci) {
    gradleArgs.push('--no-daemon', '--console=plain');
  }

  const startTime = Date.now();
  let output = '';

  return new Promise((resolve) => {
    const proc = spawn('./gradlew', gradleArgs, {
      cwd: ROOT_DIR,
      shell: true,
      stdio: quiet ? 'pipe' : 'inherit',
    });

    if (quiet && proc.stdout) {
      proc.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (onOutput) {
          text.split('\n').forEach(line => {
            if (line.trim()) onOutput(line);
          });
        }
      });
    }

    if (quiet && proc.stderr) {
      proc.stderr.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (onOutput) {
          text.split('\n').forEach(line => {
            if (line.trim()) onOutput(line);
          });
        }
      });
    }

    proc.on('close', (code) => {
      resolve({
        success: code === 0,
        duration: Date.now() - startTime,
        output,
        exitCode: code || 0,
      });
    });

    proc.on('error', (err) => {
      resolve({
        success: false,
        duration: Date.now() - startTime,
        output: err.message,
        exitCode: 1,
      });
    });
  });
}

/**
 * Parse Gradle test output for test counts
 */
export function parseTestOutput(output) {
  const lines = output.split('\n');
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;

  for (const line of lines) {
    // Match lines like: "8 tests completed, 2 failed"
    const match = line.match(/(\d+) tests? completed(?:, (\d+) failed)?/);
    if (match) {
      totalTests += parseInt(match[1], 10);
      if (match[2]) {
        failedTests += parseInt(match[2], 10);
      }
    }

    // Match lines like: "BUILD SUCCESSFUL" or "BUILD FAILED"
    if (line.includes('BUILD SUCCESSFUL')) {
      passedTests = totalTests - failedTests - skippedTests;
    }
  }

  return { totalTests, passedTests, failedTests, skippedTests };
}

/**
 * Parse Spotless output for file violations
 */
export function parseSpotlessOutput(output) {
  const violations = [];
  const lines = output.split('\n');

  let currentFile = null;
  for (const line of lines) {
    // Match file path
    const fileMatch = line.match(/^\s+(src\/.*\.java)$/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      violations.push({ file: currentFile, changes: [] });
    }
  }

  return violations;
}

/**
 * Get list of modified files from git
 */
export async function getModifiedFiles() {
  return new Promise((resolve) => {
    const proc = spawn('git', ['status', '--porcelain'], {
      cwd: ROOT_DIR,
      stdio: 'pipe',
    });

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', () => {
      const files = output
        .split('\n')
        .filter(line => line.trim())
        .map(line => ({
          status: line.substring(0, 2).trim(),
          file: line.substring(3),
        }));
      resolve(files);
    });
  });
}

/**
 * Get boot JAR paths
 */
export function getBootJarPaths() {
  return [
    'apps/product-service/build/libs/product-service.jar',
    'apps/cart-service/build/libs/cart-service.jar',
  ];
}

export { ROOT_DIR };
