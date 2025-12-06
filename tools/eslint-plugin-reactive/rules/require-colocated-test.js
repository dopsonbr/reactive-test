// tools/eslint-plugin-reactive/rules/require-colocated-test.js
import fs from 'node:fs';
import path from 'node:path';

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require co-located test files for feature components.',
      recommended: false,
    },
    messages: {
      missingTest:
        'Feature component "{{name}}" should have a co-located test file: {{expected}}',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    // Only apply to feature components
    if (
      !filename.includes('/features/') ||
      !filename.includes('/components/')
    ) {
      return {};
    }

    // Skip test files, stories, etc.
    if (
      filename.endsWith('.test.tsx') ||
      filename.endsWith('.spec.tsx') ||
      filename.endsWith('.stories.tsx') ||
      filename.includes('__')
    ) {
      return {};
    }

    // Only apply to TSX files (components)
    if (!filename.endsWith('.tsx')) {
      return {};
    }

    return {
      Program(node) {
        const testPath = filename.replace('.tsx', '.test.tsx');
        if (!fs.existsSync(testPath)) {
          context.report({
            node,
            messageId: 'missingTest',
            data: {
              name: path.basename(filename),
              expected: path.basename(testPath),
            },
          });
        }
      },
    };
  },
};
