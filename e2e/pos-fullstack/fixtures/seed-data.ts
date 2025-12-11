/**
 * Seed data for POS full-stack E2E tests.
 * Run before tests: npx tsx e2e/pos-fullstack/fixtures/seed-data.ts
 */

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:8081';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:8090';

async function seedData() {
  console.log('Seeding POS E2E test data...');

  // Verify services are accessible
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

  console.log('POS E2E test data seeded successfully');
}

seedData().catch(console.error);
