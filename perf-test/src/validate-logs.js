import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Expected loggers and their minimum counts per request
const EXPECTED_LOGGERS = {
  'productscontroller': { request: 1, response: 1 },
  'productservice': { message: 1 },  // At least start message
  'merchandiserepository': { request: 1, response: 1 },
  'pricerepository': { request: 1, response: 1 },
  'inventoryrepository': { request: 1, response: 1 }
};

const MIN_LOG_COUNT = 10; // Minimum logs per request

export function validateLogs(logFile, inputFile) {
  console.log('Loading test input...');
  const testInput = JSON.parse(readFileSync(inputFile, 'utf-8'));

  // Build lookup map by orderNumber
  const expectedByOrderNumber = new Map();
  for (const request of testInput.requests) {
    expectedByOrderNumber.set(request.metadata.orderNumber, request.metadata);
  }

  console.log(`Loaded ${expectedByOrderNumber.size} expected requests`);

  console.log('Parsing application logs...');
  const logContent = readFileSync(logFile, 'utf-8');
  const logLines = logContent.trim().split('\n').filter(line => line.trim());

  // Parse JSON logs and group by orderNumber
  const logsByOrderNumber = new Map();
  const parseErrors = [];
  let parsedCount = 0;

  for (let i = 0; i < logLines.length; i++) {
    const line = logLines[i];
    try {
      const entry = JSON.parse(line);
      if (entry.metadata && entry.metadata.orderNumber) {
        const orderNumber = entry.metadata.orderNumber;
        if (!logsByOrderNumber.has(orderNumber)) {
          logsByOrderNumber.set(orderNumber, []);
        }
        logsByOrderNumber.get(orderNumber).push({ index: i, entry });
        parsedCount++;
      }
    } catch (e) {
      parseErrors.push({ line: i, error: e.message });
    }
  }

  console.log(`Parsed ${parsedCount} log entries with metadata`);
  console.log(`Found ${logsByOrderNumber.size} unique orderNumbers in logs`);

  // Validate each request
  const failures = [];
  let passedRequests = 0;
  let missingRequests = 0;
  let crossContaminationCount = 0;
  let incompleteLogCount = 0;
  let missingLoggerCount = 0;

  for (const [orderNumber, expected] of expectedByOrderNumber) {
    const logs = logsByOrderNumber.get(orderNumber);

    if (!logs || logs.length === 0) {
      missingRequests++;
      failures.push({
        orderNumber,
        error: 'No logs found for this orderNumber',
        expected
      });
      continue;
    }

    let requestPassed = true;

    // Check minimum log count
    if (logs.length < MIN_LOG_COUNT) {
      incompleteLogCount++;
      requestPassed = false;
      failures.push({
        orderNumber,
        error: `Incomplete logs: expected at least ${MIN_LOG_COUNT}, got ${logs.length}`,
        logCount: logs.length
      });
    }

    // Check all expected loggers are present
    const loggerCounts = {};
    for (const { entry } of logs) {
      const logger = entry.logger;
      const type = entry.data?.type || 'message';
      const key = `${logger}:${type}`;
      loggerCounts[key] = (loggerCounts[key] || 0) + 1;
    }

    for (const [logger, types] of Object.entries(EXPECTED_LOGGERS)) {
      for (const [type, minCount] of Object.entries(types)) {
        const key = `${logger}:${type}`;
        const actualCount = loggerCounts[key] || 0;
        if (actualCount < minCount) {
          missingLoggerCount++;
          requestPassed = false;
          failures.push({
            orderNumber,
            error: `Missing logger: ${logger} ${type}`,
            expected: minCount,
            actual: actualCount
          });
        }
      }
    }

    // Check each log entry has matching metadata (cross-contamination check)
    for (const { index, entry } of logs) {
      const actual = entry.metadata;

      if (actual.storeNumber !== expected.storeNumber ||
          actual.orderNumber !== expected.orderNumber ||
          actual.userId !== expected.userId ||
          actual.sessionId !== expected.sessionId) {

        requestPassed = false;
        crossContaminationCount++;

        failures.push({
          orderNumber,
          expected,
          actual,
          logger: entry.logger,
          logIndex: index
        });
      }
    }

    if (requestPassed) {
      passedRequests++;
    }
  }

  // Check for logs with orderNumbers not in our test input (shouldn't happen)
  const unexpectedOrderNumbers = [];
  for (const orderNumber of logsByOrderNumber.keys()) {
    if (!expectedByOrderNumber.has(orderNumber)) {
      unexpectedOrderNumbers.push(orderNumber);
    }
  }

  const results = {
    summary: {
      totalRequests: expectedByOrderNumber.size,
      validatedRequests: logsByOrderNumber.size,
      passedRequests,
      failedRequests: expectedByOrderNumber.size - passedRequests - missingRequests,
      missingRequests,
      crossContaminationCount,
      incompleteLogCount,
      missingLoggerCount,
      unexpectedOrderNumbers: unexpectedOrderNumbers.length,
      parseErrors: parseErrors.length
    },
    failures: failures.slice(0, 100), // Limit to first 100 failures
    unexpectedOrderNumbers: unexpectedOrderNumbers.slice(0, 10),
    parseErrors: parseErrors.slice(0, 10)
  };

  // Write results
  const outputDir = join(__dirname, '..', 'output');
  mkdirSync(outputDir, { recursive: true });
  const resultsPath = join(outputDir, 'results.json');
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Print summary
  console.log('\n=== VALIDATION RESULTS ===');
  console.log(`Total requests:        ${results.summary.totalRequests}`);
  console.log(`Validated requests:    ${results.summary.validatedRequests}`);
  console.log(`Passed requests:       ${results.summary.passedRequests}`);
  console.log(`Failed requests:       ${results.summary.failedRequests}`);
  console.log(`Missing requests:      ${results.summary.missingRequests}`);
  console.log(`Cross-contamination:   ${results.summary.crossContaminationCount}`);
  console.log(`Incomplete logs:       ${results.summary.incompleteLogCount}`);
  console.log(`Missing loggers:       ${results.summary.missingLoggerCount}`);
  console.log(`Results written to:    ${resultsPath}`);

  const success = results.summary.failedRequests === 0 &&
                  results.summary.missingRequests === 0 &&
                  results.summary.crossContaminationCount === 0 &&
                  results.summary.incompleteLogCount === 0 &&
                  results.summary.missingLoggerCount === 0;

  console.log(`\nOverall: ${success ? 'PASS ✓' : 'FAIL ✗'}`);

  return { results, success };
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = JSON.parse(readFileSync(join(__dirname, '..', 'config.json'), 'utf-8'));
  const logFile = join(__dirname, '..', config.app.logFile);
  const inputFile = join(__dirname, '..', 'data', 'test-input.json');

  const { success } = validateLogs(logFile, inputFile);
  process.exit(success ? 0 : 1);
}
