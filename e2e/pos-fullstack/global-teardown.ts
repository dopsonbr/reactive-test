import { execSync } from 'child_process';

export default async function globalTeardown() {
  // By default, keep services running to avoid destroying dev environment
  // Only stop if explicitly requested with E2E_STOP_SERVICES=true
  if (process.env.E2E_STOP_SERVICES !== 'true') {
    console.log('Keeping services running (set E2E_STOP_SERVICES=true to stop)');
    return;
  }

  console.log('Stopping E2E environment...');
  const projectRoot = process.cwd().replace('/e2e/pos-fullstack', '');

  try {
    execSync('docker compose -f docker/docker-compose.yml down -v', {
      stdio: 'inherit',
      cwd: projectRoot,
    });
  } catch (error) {
    console.warn('Warning: Failed to stop Docker Compose:', error);
  }
}
