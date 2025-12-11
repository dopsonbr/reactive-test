export default async function globalTeardown() {
  if (process.env.E2E_KEEP_RUNNING !== 'true') {
    console.log('E2E tests complete. Services left running for inspection.');
  }
}
