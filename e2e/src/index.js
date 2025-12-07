import { spawn, execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateTestInput } from './generate-input.js';
import { validateLogs } from './validate-logs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const perfTestRoot = join(__dirname, '..');

// Parse CLI args
const args = process.argv.slice(2);
const vusArg = args.find(a => a.startsWith('--vus='));
const iterationsArg = args.find(a => a.startsWith('--iterations='));

// Load config
const config = JSON.parse(readFileSync(join(perfTestRoot, 'config.json'), 'utf-8'));
if (vusArg) config.k6.vus = parseInt(vusArg.split('=')[1]);
if (iterationsArg) config.k6.iterations = parseInt(iterationsArg.split('=')[1]);

const timing = {};
let wiremockProcess = null;
let appProcess = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForHealth(url, name, timeoutMs = 60000) {
  const start = Date.now();
  console.log(`Waiting for ${name} at ${url}...`);

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`${name} is ready`);
        return true;
      }
    } catch (e) {
      // Not ready yet
    }
    await sleep(1000);
  }
  throw new Error(`${name} failed to start within ${timeoutMs}ms`);
}

async function startWireMock() {
  console.log('\n=== Starting WireMock ===');
  const startTime = Date.now();

  wiremockProcess = spawn('npx', [
    'wiremock',
    '--port', String(config.wiremock.port),
    '--root-dir', join(perfTestRoot, 'wiremock')
  ], {
    cwd: perfTestRoot,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  wiremockProcess.stdout.on('data', data => {
    if (process.env.DEBUG) console.log(`[WireMock] ${data}`);
  });

  wiremockProcess.stderr.on('data', data => {
    if (process.env.DEBUG) console.error(`[WireMock] ${data}`);
  });

  await waitForHealth(`http://localhost:${config.wiremock.port}/__admin/mappings`, 'WireMock');
  timing.wiremockStartMs = Date.now() - startTime;
}

async function startApp() {
  console.log('\n=== Starting Spring Boot App ===');
  const startTime = Date.now();

  // Ensure logs directory exists
  const logsDir = join(projectRoot, 'logs');
  mkdirSync(logsDir, { recursive: true });

  // Clear previous log file
  const logFile = join(projectRoot, 'logs', 'application.log');
  if (existsSync(logFile)) {
    unlinkSync(logFile);
  }

  appProcess = spawn('./gradlew', ['bootRun'], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  appProcess.stdout.on('data', data => {
    if (process.env.DEBUG) console.log(`[App] ${data}`);
  });

  appProcess.stderr.on('data', data => {
    if (process.env.DEBUG) console.error(`[App] ${data}`);
  });

  await waitForHealth(`http://localhost:${config.app.port}/actuator/health`, 'Spring Boot App', 120000);
  timing.appStartMs = Date.now() - startTime;
}

async function runK6() {
  console.log('\n=== Running k6 Load Test ===');
  console.log(`VUs: ${config.k6.vus}, Iterations: ${config.k6.iterations}`);
  const startTime = Date.now();

  const k6Script = join(perfTestRoot, 'k6', 'load-test.js');

  return new Promise((resolve, reject) => {
    const k6 = spawn('k6', [
      'run',
      '--vus', String(config.k6.vus),
      '--iterations', String(config.k6.iterations),
      k6Script
    ], {
      cwd: perfTestRoot,
      stdio: 'inherit'
    });

    k6.on('close', code => {
      timing.k6DurationMs = Date.now() - startTime;
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`k6 exited with code ${code}`));
      }
    });
  });
}

function stopProcesses() {
  console.log('\n=== Stopping Services ===');

  if (appProcess) {
    console.log('Stopping Spring Boot app...');
    appProcess.kill('SIGTERM');
    appProcess = null;
  }

  if (wiremockProcess) {
    console.log('Stopping WireMock...');
    wiremockProcess.kill('SIGTERM');
    wiremockProcess = null;
  }
}

async function main() {
  const totalStart = Date.now();

  console.log('=== Reactive Test Performance Test ===\n');

  try {
    // Phase 1: Generate test input
    console.log('=== Generating Test Input ===');
    const genStart = Date.now();
    generateTestInput(config.k6.iterations);
    timing.generateInputMs = Date.now() - genStart;

    // Phase 2: Start WireMock
    await startWireMock();

    // Phase 3: Start app
    await startApp();

    // Phase 4: Run k6
    await runK6();

    // Give app time to flush logs
    console.log('\nWaiting for logs to flush...');
    await sleep(2000);

    // Phase 5: Stop services
    stopProcesses();

    // Phase 6: Validate logs
    console.log('\n=== Validating Logs ===');
    const validateStart = Date.now();
    const logFile = join(projectRoot, 'logs', 'application.log');
    const inputFile = join(perfTestRoot, 'data', 'test-input.json');
    const { results, success } = validateLogs(logFile, inputFile);
    timing.validationMs = Date.now() - validateStart;

    // Add timing to results
    timing.totalMs = Date.now() - totalStart;
    results.timing = timing;
    writeFileSync(join(perfTestRoot, 'output', 'results.json'), JSON.stringify(results, null, 2));

    console.log('\n=== Timing ===');
    console.log(`Generate input:  ${timing.generateInputMs}ms`);
    console.log(`WireMock start:  ${timing.wiremockStartMs}ms`);
    console.log(`App start:       ${timing.appStartMs}ms`);
    console.log(`k6 duration:     ${timing.k6DurationMs}ms`);
    console.log(`Validation:      ${timing.validationMs}ms`);
    console.log(`Total:           ${timing.totalMs}ms`);

    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('\nError:', error.message);
    stopProcesses();
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\nInterrupted, cleaning up...');
  stopProcesses();
  process.exit(1);
});

process.on('SIGTERM', () => {
  stopProcesses();
  process.exit(1);
});

main();
