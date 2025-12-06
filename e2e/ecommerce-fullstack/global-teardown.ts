import { execSync } from 'child_process';

export default async function globalTeardown() {
  if (process.env.E2E_KEEP_RUNNING === 'true') {
    console.log('Keeping services running (E2E_KEEP_RUNNING=true)');
    return;
  }

  console.log('Stopping E2E environment...');
  const projectRoot = process.cwd().replace('/e2e/ecommerce-fullstack', '');

  try {
    execSync('docker compose -f docker/docker-compose.e2e.yml down -v', {
      stdio: 'inherit',
      cwd: projectRoot,
    });
  } catch (error) {
    console.warn('Warning: Failed to stop Docker Compose:', error);
  }
}
