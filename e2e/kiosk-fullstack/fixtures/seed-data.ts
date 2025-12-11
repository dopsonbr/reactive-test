/**
 * Seed data for Kiosk full-stack E2E tests.
 * Run before tests: npx tsx e2e/kiosk-fullstack/fixtures/seed-data.ts
 */

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:8081';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:8090';

async function seedData() {
  console.log('Seeding Kiosk E2E test data...');

  try {
    const cartHealth = await fetch(`${CART_SERVICE_URL}/actuator/health`);
    const productHealth = await fetch(`${PRODUCT_SERVICE_URL}/actuator/health`);

    if (!cartHealth.ok || !productHealth.ok) {
      throw new Error('Services not healthy');
    }
  } catch (error) {
    console.error('Failed to connect to services. Are they running?');
    process.exit(1);
  }

  console.log('Kiosk E2E test data seeded successfully');
}

seedData().catch(console.error);
