import { randomUUID } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function generateUserId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRequest(id) {
  return {
    id,
    sku: Math.floor(100000 + Math.random() * 900000), // 6-digit number
    metadata: {
      storeNumber: Math.floor(1 + Math.random() * 2000),
      orderNumber: randomUUID(),
      userId: generateUserId(),
      sessionId: randomUUID()
    }
  };
}

export function generateTestInput(count = 10000) {
  console.log(`Generating ${count} test requests...`);

  const requests = [];
  for (let i = 0; i < count; i++) {
    requests.push(generateRequest(i));
  }

  const data = { requests };

  // Ensure data directory exists
  const dataDir = join(__dirname, '..', 'data');
  mkdirSync(dataDir, { recursive: true });

  const outputPath = join(dataDir, 'test-input.json');
  writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`Generated ${count} requests to ${outputPath}`);
  return data;
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const count = parseInt(process.argv[2]) || 10000;
  generateTestInput(count);
}
