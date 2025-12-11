export default async function globalTeardown() {
  // Keep services running unless explicitly told to stop
  if (process.env.E2E_KEEP_RUNNING !== 'true') {
    console.log('E2E tests complete. Services left running for inspection.');
    console.log('Set E2E_KEEP_RUNNING=false to stop services after tests.');
  }
}
