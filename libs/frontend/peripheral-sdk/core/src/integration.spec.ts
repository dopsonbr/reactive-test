import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PeripheralClient } from './peripheral-client';
import { spawn, ChildProcess } from 'child_process';
import { setTimeout } from 'timers/promises';

/**
 * Integration tests that require the emulator to be running.
 * These tests are skipped in CI unless INTEGRATION_TESTS=true
 */
describe.skipIf(!process.env.INTEGRATION_TESTS)('PeripheralClient Integration', () => {
  let emulator: ChildProcess;
  let client: PeripheralClient;

  beforeAll(async () => {
    // Start emulator
    emulator = spawn('go', ['run', '.'], {
      cwd: 'apps/peripheral-emulator',
      stdio: 'pipe',
    });

    // Wait for emulator to start
    await setTimeout(2000);
  });

  afterAll(async () => {
    if (client) {
      await client.disconnect();
    }
    if (emulator) {
      emulator.kill();
    }
  });

  it('should connect to emulator and receive capabilities', async () => {
    client = new PeripheralClient('ws://localhost:9100/stomp');

    const capsPromise = new Promise<void>((resolve) => {
      client.onCapabilities((caps) => {
        expect(caps.scanner?.available).toBe(true);
        expect(caps.payment?.available).toBe(true);
        resolve();
      });
    });

    await client.connect();
    await capsPromise;
  });
});
