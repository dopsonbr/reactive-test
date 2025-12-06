#!/usr/bin/env node
// tools/validate-tailwind-config.js

const fs = require('fs');
const path = require('path');

const configPath = path.resolve(process.cwd(), 'tailwind.config.js');

if (!fs.existsSync(configPath)) {
  console.log('⚠️  tailwind.config.js not found. Skipping validation.');
  process.exit(0);
}

async function validateConfig() {
  try {
    const config = require(configPath);
    const errors = [];

    // Check theme extends (should use tokens, not hardcoded values)
    if (config.theme?.extend?.colors) {
      const colors = config.theme.extend.colors;
      Object.entries(colors).forEach(([key, value]) => {
        if (typeof value === 'string' && value.startsWith('#')) {
          errors.push(
            `Hardcoded color in theme.extend.colors.${key}: "${value}". Use CSS variables.`
          );
        }
      });
    }

    // Check for arbitrary content in safelist
    if (config.safelist) {
      config.safelist.forEach((item, index) => {
        const pattern = typeof item === 'string' ? item : item.pattern?.source;
        if (pattern && pattern.includes('[')) {
          errors.push(
            `Safelist[${index}] contains arbitrary value pattern. Avoid safelisting arbitrary values.`
          );
        }
      });
    }

    if (errors.length > 0) {
      console.error('❌ Tailwind config validation failed:\n');
      errors.forEach((err) => console.error(`  - ${err}`));
      process.exit(1);
    }

    console.log('✅ Tailwind config validation passed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to validate Tailwind config:', err.message);
    process.exit(1);
  }
}

validateConfig();
