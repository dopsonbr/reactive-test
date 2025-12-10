#!/usr/bin/env bash
set -e

# Fetch OpenAPI spec from running product-service
echo "Fetching OpenAPI spec from product-service..."
curl -s http://localhost:8090/v3/api-docs -o tools/openapi-codegen/product-api.json

# Generate TypeScript client
echo "Generating TypeScript client..."
pnpm openapi-generator-cli generate \
  -i tools/openapi-codegen/product-api.json \
  -g typescript-fetch \
  -o libs/frontend/shared-data/api-client/src/generated \
  --additional-properties=supportsES6=true,typescriptThreePlus=true

echo "API client generation complete!"
