#!/usr/bin/env node
/**
 * Node.js version validator
 * Ensures the runtime is Node 24.x before proceeding with any operations.
 * Invoked by pnpm preinstall and prepare scripts.
 */

const REQUIRED_MAJOR = 24;

const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0], 10);

if (majorVersion !== REQUIRED_MAJOR) {
  console.error(`
┌─────────────────────────────────────────────────────────────┐
│  ERROR: Node.js version mismatch                            │
├─────────────────────────────────────────────────────────────┤
│  Required: Node ${REQUIRED_MAJOR}.x                                        │
│  Current:  Node ${nodeVersion.padEnd(40)}│
├─────────────────────────────────────────────────────────────┤
│  Please install Node ${REQUIRED_MAJOR} using one of:                       │
│    • nvm install ${REQUIRED_MAJOR} && nvm use ${REQUIRED_MAJOR}                            │
│    • asdf install nodejs ${REQUIRED_MAJOR}.0.0                             │
│    • Download from https://nodejs.org                       │
└─────────────────────────────────────────────────────────────┘
`);
  process.exit(1);
}

console.log(`✓ Node.js ${nodeVersion} detected (requires ${REQUIRED_MAJOR}.x)`);
