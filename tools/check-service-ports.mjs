#!/usr/bin/env node
/**
 * Verify Docker Compose service ports match expected configuration
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as yamlParse } from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPECTED_FILE = path.join(__dirname, 'expected-ports.json');
const COMPOSE_FILE = path.join(__dirname, '..', 'docker', 'docker-compose.yml');

// Read expected ports
const expectedPorts = JSON.parse(fs.readFileSync(EXPECTED_FILE, 'utf8'));

// Read and parse docker-compose.yml
const composeContent = fs.readFileSync(COMPOSE_FILE, 'utf8');
const compose = yamlParse(composeContent);

console.log('Checking service ports...');
console.log(`Expected ports file: ${EXPECTED_FILE}`);
console.log(`Docker Compose file: ${COMPOSE_FILE}`);
console.log('');

let errors = 0;

for (const [service, expectedPort] of Object.entries(expectedPorts)) {
  const serviceConfig = compose.services?.[service];

  if (!serviceConfig || !serviceConfig.ports || serviceConfig.ports.length === 0) {
    console.log(`  SKIP: ${service} (not found in docker-compose.yml)`);
    continue;
  }

  // Extract the host port from the first port mapping
  const portMapping = serviceConfig.ports[0];
  const hostPort = parseInt(portMapping.toString().split(':')[0], 10);

  if (hostPort === expectedPort) {
    console.log(`  OK: ${service} -> ${hostPort}`);
  } else {
    console.log(`  FAIL: ${service} -> ${hostPort} (expected ${expectedPort})`);
    errors++;
  }
}

console.log('');
if (errors === 0) {
  console.log('All service ports match expected configuration.');
  process.exit(0);
} else {
  console.log(`Found ${errors} port mismatch(es)!`);
  process.exit(1);
}
