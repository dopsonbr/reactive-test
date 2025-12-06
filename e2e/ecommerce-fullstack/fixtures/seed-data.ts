#!/usr/bin/env npx tsx
/**
 * E2E Data Seeding Script
 *
 * Seeds the database with test data for full-stack E2E tests.
 * Run this script after Docker services are healthy.
 */

const WIREMOCK_URL = process.env.WIREMOCK_URL || 'http://localhost:8082';

interface WireMockMapping {
  request: {
    method: string;
    urlPathPattern: string;
  };
  response: {
    status: number;
    jsonBody: object;
  };
}

async function seedWireMock() {
  console.log('Configuring WireMock stubs for E2E testing...');

  const mappings: WireMockMapping[] = [
    // Product mappings for E2E
    {
      request: {
        method: 'GET',
        urlPathPattern: '/merchandise/SKU-E2E-.*',
      },
      response: {
        status: 200,
        jsonBody: {
          sku: '{{request.pathSegments.[1]}}',
          name: 'E2E Test Product',
          description: 'Product created for E2E testing',
          imageUrl: 'https://via.placeholder.com/400',
          category: 'Electronics',
        },
      },
    },
    // Price mappings
    {
      request: {
        method: 'GET',
        urlPathPattern: '/price/SKU-E2E-.*',
      },
      response: {
        status: 200,
        jsonBody: {
          sku: '{{request.pathSegments.[1]}}',
          price: 99.99,
          currency: 'USD',
        },
      },
    },
    // Inventory mappings
    {
      request: {
        method: 'GET',
        urlPathPattern: '/inventory/SKU-E2E-.*',
      },
      response: {
        status: 200,
        jsonBody: {
          sku: '{{request.pathSegments.[1]}}',
          quantity: 100,
          inStock: true,
        },
      },
    },
  ];

  for (const mapping of mappings) {
    try {
      const response = await fetch(`${WIREMOCK_URL}/__admin/mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapping),
      });

      if (!response.ok) {
        console.warn(`Warning: Failed to create mapping: ${response.statusText}`);
      }
    } catch (error) {
      console.warn(`Warning: Could not connect to WireMock: ${error}`);
    }
  }

  console.log('WireMock stubs configured');
}

async function waitForServices() {
  const services = [
    { name: 'Product Service', url: 'http://localhost:8080/actuator/health' },
    { name: 'Cart Service', url: 'http://localhost:8081/actuator/health' },
    { name: 'Frontend', url: 'http://localhost:4200/health' },
  ];

  console.log('Waiting for services to be healthy...');

  for (const service of services) {
    let healthy = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!healthy && attempts < maxAttempts) {
      try {
        const response = await fetch(service.url);
        if (response.ok) {
          healthy = true;
          console.log(`${service.name}: healthy`);
        }
      } catch {
        // Service not ready yet
      }

      if (!healthy) {
        attempts++;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (!healthy) {
      throw new Error(`${service.name} failed to become healthy`);
    }
  }
}

async function main() {
  try {
    await waitForServices();
    await seedWireMock();
    console.log('\nE2E environment ready');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

main();
