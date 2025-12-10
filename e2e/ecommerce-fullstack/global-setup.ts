import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('Starting E2E environment...');

  // Check if services are already running
  try {
    const response = await fetch('http://localhost:8090/actuator/health');
    if (response.ok) {
      console.log('Services already running');
      return;
    }
  } catch {
    // Services not running, start them
  }

  // Start Docker Compose
  const projectRoot = process.cwd().replace('/e2e/ecommerce-fullstack', '');
  console.log(`Starting Docker Compose from ${projectRoot}`);

  execSync('docker compose -f docker/docker-compose.e2e.yml up -d --build', {
    stdio: 'inherit',
    cwd: projectRoot,
  });

  // Wait for health checks
  await waitForServices();
}

async function waitForServices(maxAttempts = 60) {
  const services = [
    { name: 'Product Service', url: 'http://localhost:8090/actuator/health' },
    { name: 'Cart Service', url: 'http://localhost:8081/actuator/health' },
    { name: 'Frontend', url: 'http://localhost:3001' },
  ];

  console.log('Waiting for services to become healthy...');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const results = await Promise.all(
      services.map(async (service) => {
        try {
          const res = await fetch(service.url);
          return { name: service.name, healthy: res.ok };
        } catch {
          return { name: service.name, healthy: false };
        }
      })
    );

    const allHealthy = results.every((r) => r.healthy);
    const unhealthy = results.filter((r) => !r.healthy).map((r) => r.name);

    if (allHealthy) {
      console.log('All services healthy');
      return;
    }

    if (attempt % 10 === 0) {
      console.log(`Waiting for: ${unhealthy.join(', ')}`);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error('Services failed to start within timeout');
}
