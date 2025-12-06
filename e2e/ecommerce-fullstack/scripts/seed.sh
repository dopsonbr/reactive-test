#!/usr/bin/env bash
set -e

echo "Seeding E2E test data..."

# Wait for services to be healthy
echo "Waiting for services..."
until curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; do
  echo "  Waiting for product-service..."
  sleep 2
done
echo "  product-service: healthy"

until curl -sf http://localhost:8081/actuator/health > /dev/null 2>&1; do
  echo "  Waiting for cart-service..."
  sleep 2
done
echo "  cart-service: healthy"

until curl -sf http://localhost:4200/health > /dev/null 2>&1; do
  echo "  Waiting for ecommerce-web..."
  sleep 2
done
echo "  ecommerce-web: healthy"

# Run seed script
npx tsx fixtures/seed-data.ts

echo "E2E environment ready"
